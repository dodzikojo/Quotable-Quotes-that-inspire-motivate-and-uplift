import React from "react"

function category(props){
    return (
        <button class="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded-full">
        {props.category}
      </button>
    )
}

export default category;