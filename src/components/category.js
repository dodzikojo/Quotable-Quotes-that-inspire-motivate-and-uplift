import React from "react"

function category(props){
    return (
        <button class="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-3 m-1 rounded-full">
        {props.body}
      </button>
    )
}

export default category;