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
import { faClipboard } from '@fortawesome/free-solid-svg-icons'

import quotes from 'success-motivational-quotes'

import React, { Component, useState } from 'react';
// import useState from "react"




// let displayedQuote = {
//   id: 0,
//   body: todayQuote.body,
//   author: todayQuote.by,
// }
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


  let allQuotes = quotes.getAllQuotes();
const allQuotesCategories = quotes.getAllCategories();
let todayQuote = retrieveTodayQuote();

  const [quoteState, setQuoteState] = useState({
    id: 0,
    body: todayQuote.body,
    author: todayQuote.by,
    currentQuoteCounter: 0,
    allRetrievedQuotes : allQuotes,
    totalQuotes: allQuotes.length,

  });

  function retrieveTodayQuote() {
    return quotes.getTodaysQuote();
  }

  function previousQuote() {
    setQuoteState({currentQuoteCounter: quoteState.currentQuoteCounter-1})
    setQuoteState({...quoteState, body: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter-1].body, author: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter-1].by})
  }

  function nextQuote() {
    setQuoteState({currentQuoteCounter: quoteState.currentQuoteCounter+1})
    setQuoteState({...quoteState, body: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter+1].body, author: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter+1].by})
  }

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
    
    setQuoteState({...quoteState, allRetrievedQuotes: allQuotes, totalQuotes: allQuotes.length})
    let randomQuote = allQuotes[Math.floor(Math.random()*allQuotes.length)]
    setQuoteState({...quoteState, body: randomQuote.body, author: randomQuote.by})
    quoteState.allRetrievedQuotes = allQuotes
    // console.log("This is all retrieve: "+ quoteState.allRetrievedQuotes.length)
  }
  

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

          {/* <div className="mt-4 flex justify-center">
            <button onClick={previousQuote} ><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
            <div className='px-2'>{quoteState.currentQuoteCounter} of {quoteState.totalQuotes}</div>
            <button onClick={nextQuote} className='' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
          </div> */}
          <button onClick={() => {navigator.clipboard.writeText(quoteState.body + " -" + quoteState.author)}} className='' ><FontAwesomeIcon icon={faClipboard} /></button>
        </div>
      </div>

    </div>
  )
}

// function test(){
//   console.log("test")

// }

// function getQuotesCount() {
//   this.setState({
//     totalQuotes: allQuotes.length
//   })
// }





// function retrieveQuoteByAuthor(authorName) {
//   allQuotes = quotes.getQuotesByAuthor(authorName);
// }





// function previousQuote() {
//   console.log("Previous Quote")
// }


export default App;
