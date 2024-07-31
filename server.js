const express = require('express')
const mysql = require('mysql');

const app = express();
app.use(express.json()); // เพิ่ม middleware เพื่อให้ Express สามารถแปลงข้อมูล JSON จาก request body



// MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'newdb', // แก้ชื่อฐานข้อมูลตามที่คุณต้องการ
    port: '3306'
});

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to MySQL database = ', err);
        return;
    }
    console.log('MySQL successfully connected!');
});

// create route
app.post("/create", async (req, res) => {
    const { email,password } = req.body;

    try {
        connection.query(
            "INSERT INTO users(email,password) VALUES(?,?)",
            [email,password],
            (err, results, fields) => {
                if (err) {
                    console.log("Error while inserting a user into the database", err);
                    return res.status(400).send();
                }
                return res.status(201).json({ message: "New user successfully created!" });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})

//READ
app.get("/read", async (req, res) => {
    try {
        await connection.query("SELECT * FROM users", (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).json(results);
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})

// READ single users from db
app.get("/read/single/:email", async (req, res) => {
    const email = req.params.email;

    try {
        connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).json(results)
        })
    } catch(err) {
        console.log(err);
        return res.status(500).send();
    }
})

// UPDATE data
app.patch("/update/:email", async (req, res) => {
    const email = req.params.email;
    const newPassword = req.body.newPassword;

    try {
        connection.query("UPDATE users SET password = ? WHERE email = ?", [newPassword, email], (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).json({ message: "User password updated successfully!"});
        })
    } catch(err) {
        console.log(err);
        return res.status(500).send();
    }
})

// DELETE
app.delete("/delete/:email", async (req, res) => {
    const email = req.params.email;

    try {
        connection.query("DELETE FROM users WHERE email = ?", [email], (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "No user with that email!"});
            }
            return res.status(200).json({ message: "User deleted successfully!"});
        })
    } catch(err) {
        console.log(err);
        return res.status(500).send();
    }
})

app.listen(3000, () => console.log('server is running on port 3000'));