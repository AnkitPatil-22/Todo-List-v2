//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("<-----mongo server link----->");


// Item Schema
const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to the todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


// List Schema
const listSchema = {
  name: String,
  item: [itemSchema]
};

const List = mongoose.model("List", listSchema);


// Default List
app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items added successfully");
        }
      });
      res.redirect("/");
    } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
    }

  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.item.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findOneAndDelete({_id: checkedItemId}, function(err){
      if (!err) {
        console.log("Successfully deleted checked item!");
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {item: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});


// Custom List
app.get("/:listName", function(req, res){
  const requestedListName = _.capitalize(req.params.listName);

  List.findOne({name: requestedListName}, function(err, result){
    if(!err){
      if(!result) {
        // create new list
        const list = new List ({
          name: requestedListName,
          item: defaultItems
        });
        list.save();
        console.log("New list created");
        res.redirect("/" + requestedListName);
      } else {
        // show an existing list
        res.render("list", {
          listTitle: result.name,
          newListItems: result.item
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully!");
});
