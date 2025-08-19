import bcrypt from 'bcrypt';
import mysql from 'mysql2';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

async function seedUsers() {
  await sql.promise().query(`
    CREATE TABLE IF NOT EXISTS users (
      id int auto_increment PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql.promise().query(`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, '${user.name}', '${user.email}', '${hashedPassword}')
      `);
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {

  await sql.promise().query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id int auto_increment PRIMARY KEY,
      customer_id int NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql.promise().query(`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, '${invoice.status}', '${invoice.date}')
      `),
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql.promise().query(`
    CREATE TABLE IF NOT EXISTS customers (
      id int auto_increment PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql.promise().query(`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, '${customer.name}', '${customer.email}', '${customer.image_url}')
      `),
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql.promise().query(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql.promise().query(`
        INSERT INTO revenue (month, revenue)
        VALUES ('${rev.month}', '${rev.revenue}')
      `),
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await new Promise((resolve, reject) => {
      sql.beginTransaction((err) => {
        if (err) reject(err);
        else resolve(void 0);
      });
    });
    
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    
    await new Promise((resolve, reject) => {
      sql.commit((err) => {
        if (err) reject(err);
        else resolve(void 0);
      });
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await new Promise((resolve) => {
      sql.rollback(() => resolve(void 0));
    });
    return Response.json({ error }, { status: 500 });
  }
}
