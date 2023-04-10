"use client"

import './sketch.css'

import React, { useState, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Drawing, { brushArc } from 'react-drawing'
import Loading from './components/Loading'

const lambdafunction = process.env.AWS_GATEWAY

const a_prompt = 'best quality, highly detailed, awardwinning, trending on artstation, 8k'
const n_prompt = 'lowres, bad anatomy, bad hands, missing fingers, extra digit, cropped, worst quality, low quality, text, watermark'
  // longbody, 


function Homepage() {
  const [status, setStatus] = useState('ready')
  const [percent, setPercent] = useState(0)
  const promptRef = useRef('')
  const canvasRef = useRef(null)

  // canvas size
  const w = 500, h = 500
  // brush options
  let brushColor = 'rgba(10,10,10, 0.6)'
  let brushSize = 2


  function resetCanvas() {
    const context = canvasRef.current.getContext('2d')
    context.clearRect(0, 0, w, h)
    setPercent(0)
    setStatus('ready')
  }

  async function generate(e) {
    e.preventDefault()
    e.stopPropagation()

    // --------------------------------------
    // POST request to create the prediction
    // --------------------------------------
    setStatus('POST')

    let response = null

    const prompt = promptRef.current.value
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
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
    req_body = req_body.replace(/\\n/g, '') // TODO: check if this is needed
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: req_body
    }
    try {
      response = await fetch(lambdafunction, options).then((res) => {
        return res.json()
      })
      console.log('response', response)
    } catch (error) {
      console.log(error)
      return
    }

    setStatus(response?.status)
    const prediction_id = response?.id

    if (!prediction_id) {
      console.error('No prediction id')
      resetCanvas()
      return
    }

    // --------------------------------------
    // poll prediction status
    // --------------------------------------

    // status codes:
    // starting: the prediction is starting up. If this status lasts longer than a few seconds, then it's typically because a new worker is being started to run the prediction.
    // processing: the predict() method of the model is currently running.
    // succeeded: the prediction completed successfully.
    // failed: the prediction encountered an error during processing.
    // canceled: the prediction was canceled by the user.

    function showImage(image_url) {
      // DEV: pretend that we already have the image
      console.log('image_url', image_url)
      const image = new Image()
      image.src = image_url
      image.crossOrigin = "anonymous"
      image.onload = () => {
        const context = canvasRef.current.getContext('2d')
        context.drawImage(image, 0, 0, w, h);
      }
    }

    const statuscodes = {
      running: [ 'starting', 'processing' ],
      success: [ 'succeeded' ],
      failure: [
        'failed',   // replicate.com
        'canceled', // replicate.com
        'timeout',
        'error',
      ],
    }

    const get_headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
    }

    function getPercentFromLogs(logs) {
      if (!logs) { return 0 }
      const index = logs.lastIndexOf('%')
      if (index != -1) {
          return +logs.substr(index-3, 3)
      }
    }

    async function pollUntilCompleted(id, interval=1000, maxAttempts=60) {
      let attempts = 0
      async function getStatus() {
        try {
          console.log(`Polling attempt ${attempts}`)
          const res = await fetch(`${lambdafunction}?id=${id}`, { method: 'GET', headers: get_headers });
          console.log(`Polling response`, res)
          const data = await res.json()
          console.log('response data', data)
          setStatus(data.status)
          setPercent(getPercentFromLogs(data?.logs))
          if (data.status === 'succeeded' || data.status === 'failed') {
            console.log('Final status:', data.status)
            console.log('Final data:', data)
            setPercent(100)
            const image_url = data.output.slice(-1)
            console.log('image_url', image_url)
            showImage(image_url)
            return data
          } else if (attempts >= maxAttempts) {
            console.error('Maximum number of attempts reached.')
            return null
          } else {
            attempts++
            setTimeout(getStatus, interval)
          }
        } catch (error) {
          setStatus('error')
          console.error('Error fetching status:', error)
          return null
        }
      }
      return getStatus()
    }

    pollUntilCompleted(prediction_id)

  } // generate

  return (
    <div className="App">
      <section>
        <div style={{position: 'relative'}}>
          <Loading
            percent={percent}
            height={w}
            width={h}
            visible={status !== 'ready' && status !== 'succeeded'}
          />
          <Drawing
            ref={canvasRef}
            brush={brushArc({
                fillStyle: 'black',
                size: brushSize,
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
            placeholder="E.g., oil painting of a happy turtle on the beach"
            aria-describedby="helpBlock"
          />
        </Form.Group>
        <p className="mb-3 mt-3">
          <Button onClick={generate} disabled={status !== 'ready'} className="btn btn-warning" variant="primary" type="submit">Generate</Button>
          {' '}
          <Button onClick={resetCanvas} variant="light" >Reset Canvas</Button>
        </p>
      </Form>
    </div>
  )
}

export default Homepage
