"use client"

import './sketch.css'

import React, { useState, useEffect, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Drawing, { brushArc } from 'react-drawing'

import StatusPoller from './components/StatusPoller'


function Homepage() {
  const [status, setStatus] = useState('ready')
  const [brushColor, setBrushColor] = useState('rgba(10,10,10, 0.6)')
  const canvasRef = useRef(null)

  const handleSend = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
    console.log('dataURL', dataURL)
  }

  // const handleMouseDown = (e) => {
  //   canvasRef.current.onMouseDown(e);
  // };
  // const handleMouseMove = (e) => {
  //   canvasRef.current.onMouseMove(e);
  // };
  // const handleMouseUp = (e) => {
  //   canvasRef.current.onMouseUp(e);
  // };

  //             onMouseDown={handleMouseDown}
  //             onMouseMove={handleMouseMove}
  //             onMouseUp={handleMouseUp}

  return (
    <div className="App">
      <section>
        {
          status !== 'ready' ?
            <StatusPoller />
            :
            <Drawing
              ref={canvasRef}
              brush={brushArc({
                  fillStyle: 'black',
                  size: 5,
                })}
              height={500}
              width={500}
            />
        }
      </section>
      <Form>
        <Form.Group className="mb-3 mt-3">
          {/*
          <Form.Label>Describe:</Form.Label>
          <br />
          */}
          <Form.Text id="helpBlock" muted>
            Describe what you want to see
          </Form.Text>
          <Form.Control
            id="prompt"
            as="textarea"
            rows={3} 
            placeholder="E.g., oil painting of a majestic turtle on the beach"
            aria-describedby="helpBlock"
          />
        </Form.Group>
        <p className="mb-3 mt-3">
          <Button onClick={handleSend} className="btn btn-warning" variant="primary" type="submit">Generate</Button>
          {' '}Styles:{' '}
          <Button variant="light" type="submit">Photograph</Button>{' '}
          <Button variant="light" type="submit">Oil Painting</Button>{' '}
          <Button variant="light" type="submit">Pencil Sketch</Button>
        </p>
      </Form>
    </div>
  )
}

export default Homepage
