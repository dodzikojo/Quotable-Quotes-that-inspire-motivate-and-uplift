import logo from './logo.png';
import './App.css';
import 'holderjs';
import Quotecomp from './components/quote-comp';
import Category from './components/category'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard } from '@fortawesome/free-solid-svg-icons'
import { TwitterShareButton, TwitterIcon } from 'react-share';

import quotes from 'success-motivational-quotes'

import React, { Component, useState } from 'react';

function App() {


  let allQuotes = quotes.getAllQuotes();
  const allQuotesCategories = quotes.getAllCategories();
  let todayQuote = retrieveTodayQuote();

  const [quoteState, setQuoteState] = useState({
    id: 0,
    body: todayQuote.body,
    author: todayQuote.by,
    currentQuoteCounter: 0,
    allRetrievedQuotes: allQuotes,
    totalQuotes: allQuotes.length,
  });

  function retrieveTodayQuote() {
    return quotes.getTodaysQuote();
  }

  // function previousQuote() {
  //   setQuoteState({ currentQuoteCounter: quoteState.currentQuoteCounter - 1 })
  //   setQuoteState({ ...quoteState, body: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter - 1].body, author: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter - 1].by })
  // }

  // function nextQuote() {
  //   setQuoteState({ currentQuoteCounter: quoteState.currentQuoteCounter + 1 })
  //   setQuoteState({ ...quoteState, body: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter + 1].body, author: quoteState.allRetrievedQuotes[quoteState.currentQuoteCounter + 1].by })
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

    setQuoteState({ ...quoteState, allRetrievedQuotes: allQuotes, totalQuotes: allQuotes.length })
    let randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)]
    setQuoteState({ ...quoteState, body: randomQuote.body, author: randomQuote.by })
    quoteState.allRetrievedQuotes = allQuotes
  }


  return (
    <div className="App">
      <div className="flex justify-center flex-col m-auto h-screen">
        <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
          <div>
            <img src={logo} className="App-logo mx-auto mb-2" alt="logo" />
          </div>
          {allQuotesCategories.map(createCategoryButtons)}
          <hr className='mt-4'/>

          <Quotecomp body={quoteState.body} author={quoteState.author} />

          <div className="flow-root">
            <TwitterShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              title={quoteState.body + " -" + quoteState.author}
              className="float-right Demo__some-network__share-button ml-2"
            >
              <TwitterIcon size={27} round />
            </TwitterShareButton>

            <button className="float-right text-xl" onClick={() => { navigator.clipboard.writeText(quoteState.body + " -" + quoteState.author) }} ><FontAwesomeIcon icon={faClipboard} /></button>

          </div>
        </div>
      </div>

    </div>
  )
}


export default App;
