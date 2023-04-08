"use client"

import './sketch.css'

import React, { useState, useEffect, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Drawing, { brushArc } from 'react-drawing'
import StatusPoller from './components/StatusPoller'


const lambdafunction = process.env.AWS_GATEWAY


function Homepage() {
  const [status, setStatus] = useState('ready')
  const [brushColor, setBrushColor] = useState('rgba(10,10,10, 0.6)')
  const canvasRef = useRef(null)
  const promptRef = useRef('')


  async function generate(e) {
    e.preventDefault()
    e.stopPropagation()
    const prompt = promptRef.current.value
    console.log('prompt', prompt)
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
    // console.log('dataURL', dataURL)

    const a_prompt = 'best quality, extremely detailed' // default
    const n_prompt = 'longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality' // default

    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        "version": `${process.env.REPLICATE_MODEL}`,
        "input": {
          image: dataURL,
          prompt,
          image_resolution: '512',
          ddim_steps: 50,
          scale: 9, // guidance scale
          eta: 0, // DDIM
          a_prompt, // an added prompt
          n_prompt, // negative prompts
        }
      })
    }
    console.log('method', options.method)
    console.log('body', options.body)
    console.log('headers', options.headers)

    // POST request to create the prediction
    const prediction = await fetch(lambdafunction, options).then((res) => res.json())
    console.log('prediction', prediction)

    if (!prediction?.id) {
      // TODO
      return
    }

    // poll prediction status
    const get_headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
    }
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    async function checkStatus() {
      let runloop = true
      let status = null
      let progress = null
      // while (runloop) {
        await delay(2000)
        progress = await fetch(lambdafunction + `?id=${prediction.id}`,
            { method: 'GET', headers: get_headers })
            .then((res) => res.json())
        if (progress.message === 'Internal server error') {
          status = 'error'
        }
        // runloop = progress.status !== 'succeeded' || status !== 'error'
      // }
      // console.log('finalprogress', progress)
      return progress
    }
    const finalprediction = await checkStatus()
    console.log('finalprediction', finalprediction)

  }

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
            ref={promptRef}
            id="prompt"
            as="textarea"
            rows={3} 
            placeholder="E.g., oil painting of a majestic turtle on the beach"
            aria-describedby="helpBlock"
          />
        </Form.Group>
        <p className="mb-3 mt-3">
          <Button onClick={generate} className="btn btn-warning" variant="primary" type="submit">Generate</Button>
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
