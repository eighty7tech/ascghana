import mysql from "mysql2/promise";

export async function GET() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL as string);

    const [rows] = await connection.execute("SELECT * FROM members");

    await connection.end();

    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}