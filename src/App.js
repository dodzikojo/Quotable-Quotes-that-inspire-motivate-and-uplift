import logo from './logo.png';
// import appLogo from './public/assets/logo.png';
import nav from './components/navbar';
import './App.css';
import 'holderjs';
import Quotecomp from './components/quote-comp';

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

          <button class="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded-full">
  Button
</button>

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

// function iterate(arrayItem) {
//   for (let index = 0; index < arrayItem.length; index++) {
//     const element = arrayItem[index];
//     console.log(element)
//   }
// }

function retrieveQuoteByCategory(categoryName){
  allQuotes = quotes.getQuotesByCategory(categoryName);
}

function retrieveQuoteByAuthor(authorName){
  allQuotes = quotes.getQuotesByAuthor(authorName);
}

function retrieveTodayQuote(authorName){
  return quotes.getTodaysQuote();
}



export default App;
