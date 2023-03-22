import React from "react"

const quotes = require("success-motivational-quotes");
console.log(quotes.getAllQuotes());

function Quotecomp(props) {
    return (
        <div>
            <div className="mt-3 text-4xl">
                {props.body}
            </div>

            <div className="mt-4 text-xl">
                {props.author}
            </div>
        </div>
    )
}

export default Quotecomp;
