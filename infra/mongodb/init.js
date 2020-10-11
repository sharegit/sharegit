db.createUser(
  {
     user: "sharegit",
     pwd: "",
     roles: [
       {
         role: "readWrite",
         db: "sharegit",
       }
     ]
  }
)