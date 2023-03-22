import React from "react"

const quotes = require("success-motivational-quotes");
console.log(quotes.getAllQuotes());

function Quotecomp() {
    return (
        <div>
            <div className="mt-5 text-4xl">
                Quotes body
            </div>

            <div className="mt-5 text-xl">
                Albert Einstein
            </div>
        </div>
    )
}

export default Quotecomp;
