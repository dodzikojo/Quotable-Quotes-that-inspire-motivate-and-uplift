import logo from './logo.png';
import './App.css';
import 'holderjs';
import Quotecomp from './components/quote-comp';
import Category from './components/category'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard } from '@fortawesome/free-solid-svg-icons'
import { TwitterShareButton, TelegramShareButton, WhatsappShareButton, LinkedinShareButton, EmailShareButton, RedditShareButton, RedditIcon, TwitterIcon, TelegramIcon, WhatsappIcon, EmailIcon, LinkedinIcon } from 'react-share';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  function copyToClipboard(){
    navigator.clipboard.writeText(quoteState.body + " -" + quoteState.author)

    toast.success('Copied to clipboard!', {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      });
  }

  // sm:w-4/5 md:w-4/5 lg:w-3/4  xl:w-3/4  mx-auto
  return (
    <div className="App absolute">
      <div className="flex justify-center md:flex-col md:m-auto md:h-screen">
        <div className="bg-white   p-8 pt-4 pb-4 md:p-12 my-10 rounded-lg shadow-2xl" id='mainCard'>
          <div>
            <img src={logo} className="App-logo mx-auto mb-2" alt="logo" />
          </div>
         
          <ToastContainer />
          <Quotecomp body={quoteState.body} author={quoteState.author} />
          <hr />
          {allQuotesCategories.map(createCategoryButtons)}
        

          <div className="flow-root">
            <TwitterShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              title={quoteState.body + " -" + quoteState.author}
              className="float-right Demo__some-network__share-button ml-2">
              <TwitterIcon size={27} round />
            </TwitterShareButton>

            <TelegramShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              title={quoteState.body + " -" + quoteState.author}
              className="float-right Demo__some-network__share-button  ml-2">
              <TelegramIcon size={27} round />
            </TelegramShareButton>

            <WhatsappShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              title={quoteState.body + " -" + quoteState.author}
              separator=":: "
              className="float-right Demo__some-network__share-button ml-2">
              <WhatsappIcon size={27} round />
            </WhatsappShareButton>

            <RedditShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              title={quoteState.body + " -" + quoteState.author}
              windowWidth={660}
              windowHeight={460}
              className="Demo__some-network__share-button float-right ml-2"
            >
              <RedditIcon size={27} round />
            </RedditShareButton>

            <EmailShareButton
              url={"https://dodzikojo.github.io/Quotable-Quotes-that-inspire-motivate-and-uplift/"}
              subject={"Quote by " + quoteState.author + " from Quotable"}
              body={quoteState.body + " -" + quoteState.author}
              className="Demo__some-network__share-button float-right ml-2"
            >
              <EmailIcon size={27} round />
            </EmailShareButton>

            <button className="float-right text-xl ml-2" onClick={() => copyToClipboard()} ><FontAwesomeIcon icon={faClipboard} /></button>

          </div>
        </div>
      </div>

    </div>
  )
}


export default App;
