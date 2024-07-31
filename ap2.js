const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");
const con = require('./config/db');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
// Middleware to handle status update
app.post('/updateStatus', async (req, res) => {
    const { borrowID, newStatus, assetID, assetStatus } = req.body;
    // console.log(borrowID,newStatus,assetID,assetStatus)
    const updateQuery = 'UPDATE borrow SET Borrow_status = ? WHERE BorrowID = ?';
    con.query(updateQuery, [newStatus, borrowID], function (err) {
        if (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
        const updateAsset = 'UPDATE product SET Ass_status = ? WHERE AssID = ?';
        con.query(updateAsset, [assetStatus, assetID], function (err) {
            if (err) {
                res.status(500).json({ error: 'Internal server error' });
            }
            res.status(200).json({ message: 'Status updated successfully' });
        })
    })
});

// set the public folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// for session
app.use(
    session({
        cookie: { maxAge: 24 * 60 * 60 * 1000 },
        secret: "mysecretcode",
        resave: false,
        saveUninitialized: true,
    })
);

app.get('/', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/Home.html'))
});

// +++++++++++++ Student +++++++++++++
app.get('/register', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/register.html'))
});

// ---------- Register -----------
app.put("/register", function (req, res) {
    const { UserName, UserMail, UserPass, Role } = req.body;

    bcrypt.hash(UserPass, 10, function (err, hash) {
        if (err) {
            console.error(err);
            res.status(500).send("Hashing error");
        } else {
            const sql = "INSERT INTO user (UserName, UserMail, UserPass, Role) VALUES (?, ?, ?, ?)";
            con.query(sql, [UserName, UserMail, hash, Role], function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(500).send("Registration failed");
                } else {
                    res.status(200).send("User registered successfully");
                }
            });
        }
    });
});

// ================Login===============
app.get('/login', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/login.html'))
});



// ------------- Get username --------------
app.get("/user", function (req, res) {
    const sql = "SELECT UserName, UserMail FROM user WHERE UserID=?";
    con.query(sql, [req.session.userID], function (err, results) {
        if (err) {
            console.error(err);
            res.status(500).send("DB error");
        } else {
            res.json(results);
        }
    });
});


// ----------login-----------
app.post("/login", function (req, res) {
    const { email, password } = req.body;
    const sql = "SELECT UserID, UserMail, UserName, UserPass, Role FROM user WHERE UserMail= ?";
    console.log(email, password);
    con.query(sql, [email], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("DB error");
        }
        if (results.length !== 1) {
            return res.status(401).send("Email not found");
        }
        bcrypt.compare(password, results[0].UserPass, function (err, same) {
            if (err) {
                console.error(err);
                return res.status(500).send("Password compare error");
            }
            else if (same) {
                req.session.userID = results[0].UserID;
                req.session.email = results[0].UserMail;

                switch (results[0].Role) {
                    case 0:
                        return res.send("http://localhost:3000/list1/student");
                    case 1:
                        return res.send("http://localhost:3000/list/apporve/lecturer");
                    case 2:
                        return res.send("http://localhost:3000/list/staff-edit/staff");
                    default:
                        return res.status(500).send("Invalid Role");
                }
            } else {
                return res.status(401).send("Wrong password");
            }
        });
    });
});

app.get('/list1/student', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/list_asset.html'))
});
app.get('/list2/student', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/list_asset_select.html'))
});
app.get('/list/enterdate/student', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/enter_datenew.html'))
});
app.get('/list/confirm-borrow/student', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/comfirm_borrowingnew.html'))
});
app.get('/list/status/student', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/checkstatus.html'))
});

app.post('/saveBorrowingData', async (req, res) => {

    const borrowingData = req.body.items;

    if (!borrowingData) {
        return res.status(400).send("Invalid borrowing data structure");
    }

    // Extract values from items and dates arrays
    const borrowingValues = borrowingData.map((item, index) => ({
        AssID: item.AssID,
        UserID: req.session.userID,
        Borrowed: item.Borrowed,
        Returned: item.Returned,
        Borrow_status: item.Borrow_status,
        Reject_note: '',
    }));

    const insertPromises = borrowingValues.map((value) => {
        return new Promise((resolve, reject) => {
            const borrowingSql = "INSERT INTO borrow SET ?";
            con.query(borrowingSql, value, function (err, results) {
                if (err) {
                    console.error(err);
                    reject("Database server error");
                } else {
                    resolve(results);
                }
            });
        });
    });
    try {
        await Promise.all(insertPromises);
        res.send("Borrowing data saved successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
app.get('/borrow', function (req, res) {
    const query =
        "SELECT * FROM borrow;";
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(results);
            // console.log(results);
        }
    });
})

app.get('/profile', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/profile.html'))
});



// +++++++++++++ Staff +++++++++++++
// ---------- login -----------
app.get('/login/staff', function (req, res) {
    res.sendFile(path.join(__dirname, '/project/login_staff.html'))
});

app.get('/list/staff-edit/staff', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/staff-edit.html'))
});
app.get('/list/staff-list/staff', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/staff-list.html'))
});

// ----------------Dashboard Staff------------- //
app.get('/dbstaff', function (req, res) {
    const query =
        "SELECT * FROM product;";
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(results);
            // console.log(results);
        }
    });
})

// ==============history==============
app.get('/list/history/staff', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/history_staff.html'))
});
app.get('/hb', function (req, res) {
    const query =
        "SELECT borrow.*, product.*, user.UserName, user.UserID FROM borrow JOIN product ON borrow.AssID = product.AssID JOIN user ON borrow.UserID = user.UserID;";
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(results);
            // console.log(results);
        }
    });
})

//---------------Borowing Return----------------
app.get('/br', function (req, res) {
    const query =
        "SELECT borrow.*, product.*, user.UserName, user.UserID FROM borrow JOIN product ON borrow.AssID = product.AssID JOIN user ON borrow.UserID = user.UserID WHERE product.Ass_status = 2;";

    con.query(query, (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(results);
            // console.log(results);
        }
    });
})

app.get('/list/return/staff', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/staff-return.html'))
});

// ------------- Edit a product --------------
app.put("/products/update", function (req, res) {
    const newProduct = req.body;
    var query = con.query("UPDATE product SET AssName = ?, Ass_status = ? WHERE AssID = ? ", [newProduct.AssetName, newProduct.Ass_status, newProduct.AssID], function (err, results) {
        console.log(query);
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.affectedRows != 1) {
            return res.status(500).send(newProduct);
        }
        res.send("Update succesfully");
    });
});

// ------------- Add a new product --------------
app.post("/products", function (req, res) {
    var newProduct = req.body;
    const sql = "INSERT INTO product SET ?";
    con.query(sql, newProduct, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.affectedRows != 1) {
            console.error('Row added is not 1');
            return res.status(500).send("Add failed");
        }
        res.send("Add succesfully");
    });
});
// ------------- GET all products --------------
app.get("/products", function (_req, res) {
    const sql = "SELECT * FROM product ORDER BY Ass_status";
    con.query(sql, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// ------------- DELETE a product --------------
app.delete("/products/:id", function (req, res) {
    const sql = "DELETE FROM product WHERE AssID=?";
    con.query(sql, [req.params.id], function (err, results) {
        if (err) {
            console.error(err);
            res.status(500).send(sql);
        } else if (results.affectedRows != 1) {
            res.status(500).send("Delete failed");
        } else {
            res.send('Delete complete');
        }
    });
});

// ===================== Search Product ==========================
app.get("/products/search/:query", function (req, res) {
    const searchTerm = req.params.query;
    const sql = "SELECT * FROM product WHERE AssName LIKE ?";
    con.query(sql, [`%${searchTerm}%`], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

app.get("/products/search/", function (req, res) {
    const sql = "SELECT * FROM product";
    con.query(sql, [], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});



// +++++++++++++ Lecturer +++++++++++++

app.get('/list/apporve/lecturer', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/apporve_lecturer.html'))
});
app.get('/list/db/lec', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/db-lec.html'))
});
app.get('/list/history/lec', function (_req, res) {
    res.sendFile(path.join(__dirname, '/project/history-lec.html'))
});



app.patch('/borrow/:borrowID', (req, res) => {
    const borrowID = req.params.borrowID;
    const newStatus = req.body.Borrow_status;
    const rejectNote = req.body.Reject_note;
    const approver = "lec";
    const updateSql = "UPDATE borrow SET Borrow_status = ?, Reject_note = ?, approver = ? WHERE BorrowID = ?";
    con.query(updateSql, [newStatus, rejectNote, approver, borrowID], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database server error' });
        }

        res.json({ success: true, message: 'Borrow_status updated successfully' });
    });
});


// ------------- GET all products --------------
app.get("/products", function (_req, res) {
    const sql = "SELECT * FROM product ORDER BY Ass_status";
    con.query(sql, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// ---------- password generator -----------
app.get("/password/:pass", function (req, res) {
    const password = req.params.pass;
    const saltRounds = 10;


    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
            return res.status(500).send("Hashing error");
        }

        res.send(hash);
    });
});
app.put("/return/:BorrowID", function (req, res) {
    const BorrowID = req.params.BorrowID;

    const selectSql = "SELECT `status`, `AssID` FROM `borrow` WHERE `BorrowID` = ?";
    con.query(selectSql, [BorrowID], function (selectErr, selectResult) {
        if (selectErr) {
            console.error(selectErr);
            return res.status(500).send("DB error");
        }

        if (selectResult.length === 0) {
            return res.status(404).send("Borrow record not found");
        }

        const borrowStatus = selectResult[0].Ass_status;
        const productId = selectResult[0].AssID;

        if (borrowStatus !== 1) {
            return res.status(400).send("Item is not currently borrowed");
        }


        const updateBorrowSql = "UPDATE `borrow` SET `Ass_status` = 4 WHERE `borrow`.`BorrowID` = ?";
        con.query(updateBorrowSql, [BorrowID], function (updateBorrowErr, updateBorrowResult) {
            if (updateBorrowErr) {
                console.error(updateBorrowErr);
                return res.status(500).send("Failed to update borrow status");
            }

            if (updateBorrowResult.affectedRows > 0) {

                const updateProductSql = "UPDATE `product` SET `status` = 0 WHERE `product`.`product_id` = ?";
                con.query(updateProductSql, [productId], function (updateProductErr, updateProductResult) {
                    if (updateProductErr) {
                        console.error(updateProductErr);
                        return res.status(500).send("Failed to update product status");
                    }


                    if (updateProductResult.affectedRows > 0) {
                        res.send("Item returned successfully");
                    } else {
                        res.status(500).send("Failed to update product status");
                    }
                });
            } else {
                res.status(500).send("Failed to update borrow status");
            }
        });
    });
});
//------------------------------------------------------------------------

const PORT = 3000;
app.listen(PORT, function () {
    console.log('Server is running at port ' + PORT);
});