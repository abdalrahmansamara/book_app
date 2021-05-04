'use strict'

require('dotenv').config();
const express = require('express')
const server = express();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override')
server.set('view engine','ejs')
server.use(express.static('./public'))
server.use(express.urlencoded({extended:true}));
server.use(methodOverride('_method'))
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// const client = new pg.Client(process.env.DATABASE_URL)

const PORT = process.env.PORT || 3000;

client.connect()
.then( () => {
server.listen(PORT, () => { console.log(`you are listining to port ${PORT}`)})
})
server.get('/',homePage)
server.get('/hello', indexRender)
server.get('/new', newHandler)
server.post('/searches', handleSearches)
server.post('/books',handleNewBook)
server.get('/books/:id', singleBookRender)
server.put('/updateBook/:id', updateBook)
server.delete('/deleteBook/:id', deleteBook)
server.get('*',errorHandler)



function indexRender (req,res) {
    res.render('pages/index');
}

function homePage (req,res) {
    let SQL = `SELECT * FROM books`
    client.query(SQL)
    .then(datas => {
        res.render('pages/home', {data: datas.rows});
    })
    
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
function handleNewBook (req,res) {
    let {image_url,title, author, description, ISBN} = req.body;
    let SQL = `INSERT INTO books (title,author,description,image_url,ISBN) VALUES ($1,$2,$3,$4,$5) RETURNING *;`
    let safeValues = [title, author, description, image_url, ISBN];
    client.query(SQL,safeValues)
    .then(data=>{
        res.redirect(`/books/${data.rows[0].id}`);
    })
}

function singleBookRender (req,res) {
    let id = req.params.id;
    let SQL = `SELECT * FROM books WHERE id = $1`
    let safeValues = [id];
    client.query(SQL,safeValues)
    .then(data => {
        console.log(data.rows[0]);
        res.render('pages/books/detail', {single: data.rows[0]})
    })
}

function updateBook (req,res) {
    let {image_url, title, author, description, ISBN} = req.body;
    let SQL = `UPDATE books SET title=$1, author=$2, description=$3, image_url=$4, ISBN=$5 WHERE id=$6;`
    let safeValues = [title, author, description, image_url, ISBN, req.params.id]
    client.query(SQL,safeValues)
    .then( ()=> {
        res.redirect(`/books/${req.params.id}`)
    })
}

function deleteBook (req,res) {
    let SQL = `DELETE FROM books WHERE id=$1;`;
    let safeValues = [req.params.id]
    client.query(SQL,safeValues)
    .then(()=>{
        res.redirect('/')
    })
}

// error handler
function errorHandler (req,res) {
    res.render('pages/error')
}



function Book (element) {
    this.title = element.title ? element.title :  `title is not available`;
    this.author = element.authors ? element.authors.join(', ') : `author name not found`;
    this.description = element.description ? element.description : `there is no description`;
    this.image_url = element.imageLinks.thumbnail || element.imageLinks.smallThumbnail || `https://i.imgur.com/J5LVHEL.jpg`; 
    this.ISBN = element.industryIdentifiers ? `ISBN type: ${element.industryIdentifiers[0].type}, identifier: ${element.industryIdentifiers[0].identifier}` : `ISBN not found`
}