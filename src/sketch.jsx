"use client"

import './sketch.css'

import React, { useState, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Drawing, { brushArc } from 'react-drawing'
import Loading from './components/Loading'


const lambdafunction = process.env.AWS_GATEWAY


function Homepage() {
  const [status, setStatus] = useState('ready')
  const [percent, setPercent] = useState(0)
  const [brushColor, setBrushColor] = useState('rgba(10,10,10, 0.6)')

  const promptRef = useRef('')
  const canvasRef = useRef(null)

  const w = 500, h = 500

  function clearCanvas() {
    const context = canvasRef.current.getContext('2d')
    context.clearRect(0, 0, w, h)
    setPercent(0)
    setStatus('ready')
  }

  async function generate(e) {
    e.preventDefault()
    e.stopPropagation()

    setStatus('polling')

    const prompt = promptRef.current.value
    console.log('prompt', prompt)
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
    // console.log('dataURL', dataURL)

    const a_prompt = 'best quality, extremely detailed' // default
    const n_prompt = 'longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality' // default

    /*
    let req_body =  JSON.stringify({
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
    req_body = req_body.replace(/\\n/g, '')

    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: req_body
    }
    console.log('method', options.method)
    console.log('body', options.body)
    console.log('headers', options.headers)

    // POST request to create the prediction
    try {
      const response = await fetch(lambdafunction, options).then((res) => {
        console.log('res', res)
        return res.json()
      })
      console.log('response', response)
    } catch (error) {
      console.log(error)
      return
    }
    */

    // if (!prediction?.id) {
    //   // TODO
    //   return
    // }


    // poll prediction status
    // const get_headers = {
    //   'Accept': 'application/json',
    //   'Content-Type': 'application/json',
    //   'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
    // }
    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    // async function checkStatus() {
      // let runloop = true
      // let status = null
      // let progress = null
      // while (runloop) {
        // await delay(1000)
        // progress = await fetch(lambdafunction + `?id=${prediction.id}`,
        //     { method: 'GET', headers: get_headers })
        //     .then((res) => res.json())
        // if (progress.message === 'Internal server error') {
        //   status = 'error'
        // }
        // runloop = progress.status !== 'succeeded' || status !== 'error'
      // }
      // console.log('finalprogress', progress)
    //   return progress
    // }
    // const finalprediction = await checkStatus()
    // console.log('finalprediction', finalprediction)

    setTimeout(() => {
      setPercent(20)
    }, 1000);

    setTimeout(() => {
      setPercent(35)
    }, 2000);

    setTimeout(() => {
      setPercent(50)
    }, 3000);

    setTimeout(() => {
      setPercent(75)
    }, 4000);

    setTimeout(() => {
      setPercent(100)
    }, 5000);

    function showImage() {
      // DEV: pretend that we already have the image
      const image_url = 'https://replicate.delivery/pbxt/c0fSfa87tngxKE8Xs250bfaVrjmsItyR3LMaFtUtqwjb9HRgA/out-0.png'
      console.log(image_url)
      console.log(canvasRef.current)
      const image = new Image()
      image.src = image_url
      image.onload = () => {
        const context = canvasRef.current.getContext('2d')
        context.drawImage(image, 0, 0, w, h);
      }
    }

    setTimeout(() => {
      setStatus('ready')
      showImage()
    }, 6000);

  }

  console.log('loader visible:', status !== 'ready')

  return (
    <div className="App">
      <section>
        <div style={{position: 'relative'}}>
          <Loading
            percent={percent}
            height={w}
            width={h}
            visible={status !== 'ready'}
          />
          <Drawing
            ref={canvasRef}
            brush={brushArc({
                fillStyle: 'black',
                size: 5,
              })}
            height={w}
            width={h}
          />
        </div>
      </section>
      <Form>
        <Form.Group className="mb-3 mt-3">
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
          {' '}
          <Button onClick={clearCanvas} variant="light" >Start Over</Button>
          {/*
          Styles:{' '}
          <Button variant="light" type="submit">Photograph</Button>{' '}
          <Button variant="light" type="submit">Oil Painting</Button>{' '}
          <Button variant="light" type="submit">Pencil Sketch</Button>
          */}
        </p>
      </Form>
    </div>
  )
}

export default Homepage
