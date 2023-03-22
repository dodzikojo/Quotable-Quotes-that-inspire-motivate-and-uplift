import logo from './logo.png';
// import appLogo from './public/assets/logo.png';
import nav from './components/navbar';
import './App.css';
import 'holderjs';
import Quotecomp from './components/quote-comp';
import Category from './components/category'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowRight } from '@fortawesome/free-solid-svg-icons'
import { faCircleArrowLeft } from '@fortawesome/free-solid-svg-icons'

import quotes from 'success-motivational-quotes'

import React, { Component } from 'react';

class App extends Component {
  constructor() {
    super()
    this.state = {
      body: retrieveTodayQuote().body,
      author: retrieveTodayQuote().author
      
    }
  }

   nextQuote() {
    console.log("Next quote")
    this.setState({
      body: 'Sample Body',
      author: "Sample Author"
    })
  }


  render() {

    return (

      <div className="App">
        <div className="flex justify-center flex-col m-auto h-screen">
          <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
            <div>
              <img src={logo} className="App-logo mx-auto mb-2" alt="logo" />
            </div>
            {allQuotesCategories.map(createCategoryButtons)}
            <hr />

            <Quotecomp body={this.state.body} author={this.state.author} />
            {/* <div>{this.state.body}</div> */}

            <div className="mt-5 flex justify-center">
              <button onClick={previousQuote} ><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
              <button onClick={() => this.nextQuote()} className='ml-2' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
            </div>
          </div>
        </div>

      </div>
    );
  }
}


const allQuotes = quotes.getAllQuotes();
const allQuotesCategories = quotes.getAllCategories();
console.log(allQuotesCategories);




function createCategoryButtons(category) {
  return (
    <Category onClick={getButtonCategory} data-category={category} body={category} />
  )
}

function getButtonCategory(e) {
  let categoryName = e.currentTarget.getAttribute("data-category")
  retrieveQuoteByCategory(categoryName)
}


function retrieveQuoteByCategory(categoryName) {
  // allQuotes = quotes.getQuotesByCategory(categoryName);
  console.log(quotes.getQuotesByCategory(categoryName))
}

function retrieveQuoteByAuthor(authorName) {
  allQuotes = quotes.getQuotesByAuthor(authorName);
}

function retrieveTodayQuote() {
  return quotes.getTodaysQuote();
}



function previousQuote() {
  console.log("Previous Quote")
}


export default App;
