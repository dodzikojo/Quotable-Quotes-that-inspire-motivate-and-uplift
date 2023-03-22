import logo from './logo.png';
// import appLogo from './public/assets/logo.png';
import nav from './components/navbar';
import './App.css';
import 'holderjs';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowRight } from '@fortawesome/free-solid-svg-icons'
import { faCircleArrowLeft } from '@fortawesome/free-solid-svg-icons'

function App() {
  return (
    <div className="App">
      <div className="flex justify-center flex-col m-auto h-screen">
        <div className="bg-white w-1/2 mx-auto  p-8 md:p-12 my-10 rounded-lg shadow-2xl">
          <div>
            <img src={logo} className="App-logo mx-auto" alt="logo" />
          </div>
          <div className="mt-5 text-4xl">
            Life is like riding a bicycle. To keep your balance you must keep moving.
          </div>

          <div className="mt-5 text-xl">
            Albert Einstein
          </div>

          <div className="mt-5 flex justify-center">
            <button><FontAwesomeIcon icon={faCircleArrowLeft} /></button>
            <button className='ml-2' ><FontAwesomeIcon icon={faCircleArrowRight} /></button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
