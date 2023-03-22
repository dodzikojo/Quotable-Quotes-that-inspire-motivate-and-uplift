import React from "react"

function category(props){
    return (
        <button onClick={props.onClick} data-category={props.body} id={props.body} key={props.body} title={props.body} type="button" className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-3 m-1 rounded-full">
        {props.body}
      </button>
    )
}

export default category;