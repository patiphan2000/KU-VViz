import React from 'react'

import { KuVViz } from 'ku-vviz';
import 'ku-vviz/dist/index.css';

import data from './data/data.json'
import stdData from './data/stdData2.json'
import enrollData from './data/enrollData.json'

const App = () => {
  return (<KuVViz 
  course={data.result} 
  stdGrade={[]}
  stdEnroll={enrollData.results}
  />)
}

export default App
