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


const allQuotes = quotes.getAllQuotes();
let quote;

function App() {
  return (
    <div className="App">
      <div className="flex justify-center flex-col m-auto h-screen">
        <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
          <div>
            <img src={logo} className="App-logo mx-auto" alt="logo" />
          </div>

          <Category/>
          <Quotecomp />

          <div className="mt-5 flex justify-center">
            <button><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
            <button className='ml-2' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
          </div>
        </div>
      </div>

    </div>
  );
}


function retrieveQuoteByCategory(categoryName) {
  allQuotes = quotes.getQuotesByCategory(categoryName);
}

function retrieveQuoteByAuthor(authorName) {
  allQuotes = quotes.getQuotesByAuthor(authorName);
}

function retrieveTodayQuote(authorName) {
  return quotes.getTodaysQuote();
}



export default App;
