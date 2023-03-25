import React from 'react';

const SearchBar = ({keyword, onChange}) => {
    const BarStyle = {
        width:"90%",
        background:"#f5f5f5", 
        border:"none", 
        padding:"0.5rem",
        borderRadius: '0.25rem'
    };
    return (
      <input 
       style={BarStyle}
       key="search-bar"
       value={keyword}
       placeholder={"ชื่อรายวิชา, รหัสวิชา"}
       onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  
  export default SearchBar;