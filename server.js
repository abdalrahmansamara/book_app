'use strict'

require('dotenv').config();
const express = require('express')
const server = express();
const superagent = require('superagent');

server.set('view engine','ejs')
server.use(express.static('./public'))
server.use(express.urlencoded({extended:true}));
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => { console.log(`you are listining to port ${PORT}`)})

server.get('/',homePage)
server.get('/hello', indexRender)
server.get('/new', newHandler)
server.post('/searches', handleSearches)
server.get('*',errorHandler)


function indexRender (req,res) {
    res.render('pages/index');
}

function homePage (req,res) {
    res.render('pages/home');
}

function newHandler (req,res) {
    res.render('searches/new')   
} 

function handleSearches (req,res) {
    let name = req.body.name;
    let choose = req.body.choose;
    let newBooks = []
    let url = `https://www.googleapis.com/books/v1/volumes?q=+${name}:${choose}`
    superagent.get(url)
    .then(data=>{
        // res.send(data.body)
        data.body.items.forEach(element=>{
            let newBook = new Book (element.volumeInfo)
            newBooks.push(newBook);
        })
        res.render('searches/show', {books: newBooks});
    }) 
}

function errorHandler (req,res) {
    res.render('pages/error')
}

function Book (element) {
    this.title = element.title || `title is not available`;
    this.author = element.authors || `author name not found`;
    this.description = element.description || `there is no description`;
    this.image_url = element.imageLinks.thumbnail || element.imageLinks.smallThumbnail || `https://i.imgur.com/J5LVHEL.jpg`; 
}