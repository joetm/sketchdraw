import React, { useState } from 'react'


function Loader({width, height, percent=0, visible=false}) {

  // console.log('loader percent', percent)
  // console.log('loader visible', visible)

  const styles = {
    loader: {
      width: `${width}px`,
      height: `${height}px`,
      margin: 0,
      padding: 0,
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: 0.8,
      overflow: 'hidden',
      display: visible ? 'block' : 'none',
      zIndex: 999,
    },
    percentage: {
      border: 0,
      margin: 0,
      padding: 0,
      display: 'table-cell',
      backgroundColor: 'red',
      height: `${height}px`,
      width: `${percent / 100 * width}px`,
      position: 'relative',
      top: 0,
      left: 0,
      verticalAlign: 'middle',
    },
  }
  return (
    <div className="loader" style={styles.loader}>
      <div className="percentage" style={styles.percentage}>
      </div>
    </div>
  )
}

export default Loader
