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

import React, { Component, useState } from 'react';
// import useState from "react"


let allQuotes = quotes.getAllQuotes();
const allQuotesCategories = quotes.getAllCategories();
let todayQuote = retrieveTodayQuote();

let displayedQuote = {
  id: 0,
  body: todayQuote.body,
  author: todayQuote.by,
}
// console.log(allQuotesCategories);

// class App extends Component {
//   constructor() {
//     super()
//     this.state = {
//       body: displayedQuote.body,
//       author: displayedQuote.author,
//       totalQuotes: allQuotes.length

//     }
//   }



//  retrieveTodayQuote() {
//   return quotes.getTodaysQuote();
// }





// render() {

//   return (

//     <div className="App">
//       <div className="flex justify-center flex-col m-auto h-screen">
//         <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
//           <div>
//             <img src={logo} className="App-logo mx-auto mb-2" alt="logo" />
//           </div>
//           {allQuotesCategories.map(createCategoryButtons)}
//           <hr />

//           <Quotecomp body={this.state.body} author={this.state.author} />

//           <div className="mt-4 flex justify-center">
//             <button onClick={() => this.previousQuote()} ><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
//             <div className='px-2'>1 of {this.state.totalQuotes}</div>
//             <button onClick={() => this.nextQuote()} className='' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// }
// }

function App() {

  const [quoteState, setQuoteState] = useState({
    id: 0,
    body: todayQuote.body,
    author: todayQuote.by,
    currentQuote: 1,
    totalQuotes: allQuotes.length,
  });


  return (
    <div className="App">
      <div className="flex justify-center flex-col m-auto h-screen">
        <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
          <div>
            <img src={logo} className="App-logo mx-auto mb-2" alt="logo" />
          </div>
          {allQuotesCategories.map(createCategoryButtons)}
          <hr />

          <Quotecomp body={quoteState.body} author={quoteState.author} />

          <div className="mt-4 flex justify-center">
            <button onClick={() => setQuoteState({ ...quoteState, currentQuote: quoteState.currentQuote-1})} ><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
            <div className='px-2'>{quoteState.currentQuote} of {quoteState.totalQuotes}</div>
            <button onClick={() => setQuoteState({ ...quoteState, currentQuote: quoteState.currentQuote+1})} className='' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
          </div>
        </div>
      </div>

    </div>
  )
}

// function getQuotesCount() {
//   this.setState({
//     totalQuotes: allQuotes.length
//   })
// }

// function previousQuote() {
//   this.setState({
//     body: 'Previous Sample Body',
//     author: "Previous Sample Author",
//     totalQuotes: "3"

//   })
// }

// function nextQuote() {
//   this.setState({
//     body: 'Next Sample Body',
//     author: "Next Sample Author",
//     totalQuotes: "4"
//   })
// }


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
  allQuotes = quotes.getQuotesByCategory(categoryName);
  // console.log(quotes.getQuotesByCategory(categoryName))
}

// function retrieveQuoteByAuthor(authorName) {
//   allQuotes = quotes.getQuotesByAuthor(authorName);
// }

function retrieveTodayQuote() {
  return quotes.getTodaysQuote();
}



// function previousQuote() {
//   console.log("Previous Quote")
// }


export default App;
