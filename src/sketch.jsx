"use client"

import './sketch.css'

import React, { useState, useEffect, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Drawing, { brushArc } from 'react-drawing'
import StatusPoller from './components/StatusPoller'

// const replicate = new Replicate({token: process.env.REPLICATE_API_TOKEN})
const lambdafunction = process.env.VITE_LAMBDA_FUNCTION


function Homepage() {
  const [status, setStatus] = useState('ready')
  const [brushColor, setBrushColor] = useState('rgba(10,10,10, 0.6)')
  const canvasRef = useRef(null)
  const promptRef = useRef('')


  async function handleSend(e) {
    e.preventDefault()
    e.stopPropagation()
    const prompt = promptRef.current.value
    console.log('prompt', prompt)
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
    console.log('dataURL', dataURL)
    // let image = dataURL.split('data:image/png;')[1]
    // console.log('image', image)

    const a_prompt = 'best quality, extremely detailed' // default
    const n_prompt = 'longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality' // default

    // const controlnetModel = await replicate.models.get("jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117")
    // const controlnetPrediction = await controlnetModel.predict({
    //   image: dataURL,
    //   prompt: prompt,
    //   image_resolution: '512',
    //   ddim_steps: 50,
    //   scale: 9, // guidance scale
    //   eta: 0, // DDIM
    //   a_prompt, // an added prompt
    //   n_prompt, // negative prompts
    // })

    // TODO: move this to node server
    const options = {  
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': "*",
        'Host': 'localhost',
        // 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        "version": "435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
        "input": {
          image: dataURL,
          prompt: prompt,
          image_resolution: '512',
          ddim_steps: 50,
          scale: 9, // guidance scale
          eta: 0, // DDIM
          a_prompt, // an added prompt
          n_prompt, // negative prompts
        }
      })
    }

    const output = await fetch(lambdafunction, options)
      .then((res) => res.json())

    console.log('output', output)

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
