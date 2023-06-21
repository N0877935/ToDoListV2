//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const { name } = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb+srv://admin-joe:test123@cluster0.okzfzxi.mongodb.net/todolistDB");

  const { Schema } = mongoose;

  const itemsSchema = new Schema({
    name: String,
  });

  const Item = mongoose.model("Item", itemsSchema);

  const itemOne = new Item({
    name: "Welcome to your todolist!",
  });

  const itemTwo = new Item({
    name: "Hit the + button to add a new item.",
  });

  const itemThree = new Item({
    name: "<-- Hit this to delete an item..",
  });

  const defaultItems = [itemOne, itemTwo, itemThree];

  const listSchema = {
    name: String,
    items: [itemsSchema],
  };

  const List = mongoose.model("List", listSchema);


  app.get("/", function (req, res) {
    Item.find().then((data) => {
      if (data.length === 0) {
        console.log("Database is empty.");
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved items to Database");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        console.log(data);
        res.render("list", { listTitle: "Today", newListItems: data });
        // mongoose.connection.close();
      }
    });
  });

  app.get("/:customListName", (req, res) => {
    const customListName = req.params.customListName;

    const list = new List({
      name: customListName,
      items: defaultItems,
    });



    List.findOne({name: customListName}).then((foundList) => {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items})
      }
    });
  });

  app.post("/", function (req, res) {
    const itemName = req.body.item;
    const listName = req.body.list;

    const item = new Item({
      name: itemName,
    });

    if(listName === 'Today') {
      item.save().then( () => {
        console.log("List item added.");
        res.redirect('/');
      });
    } else {
      List.findOne({name: listName}).then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect('/' + listName);
      })
    }

  });

  app.post("/delete", (req, res) => {
    const checkItemId = req.body.checkBox;
    const listName = req.body.listName;

    if(listName === 'Today') {
      Item.findByIdAndRemove(checkItemId).then(function () {
        console.log(`Item under id ${checkItemId} was removed.`);
        res.redirect('/');
      });
    } else {
      Item.findByIdAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}).then(() => {
        res.redirect('/' + listName);
      });
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}
