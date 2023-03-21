import logo from './logo.svg';
import nav from './components/navbar';
import './App.css';
import 'holderjs';


import Toast from 'react-bootstrap/Toast';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import quote from './components/quote';


function App() {
  return (
    <div className="App">
    <quote/>
      {/* <Card style={{ width: "18rem" }}>
        <Card.Img variant="top" src="holder.js/100px180" />
        <Card.Body>
          <Card.Title>A product name</Card.Title>
          <Card.Text>
            Some main content text can go here, a product description for example
          </Card.Text>
          <Button variant="primary">View</Button>
        </Card.Body>
      </Card> */}
      

    </div>
  );
}

export default App;
