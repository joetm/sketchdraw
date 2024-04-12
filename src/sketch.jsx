// "use client"

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'

// import Drawing, { brushArc } from 'react-drawing'
// import Drawing from './DrawingWrapper'
import Drawing, { brushArc } from './react-drawing/src/index.ts'

import Loading from './components/Loading'
import { ArrowRepeat } from 'react-bootstrap-icons'


const lambdafunction = process.env.AWS_GATEWAY
const replToken = process.env.REPLICATE_API_TOKEN
const replGenModel = process.env.REPLICATE_GEN_MODEL
const replDescribeModel = process.env.REPLICATE_DESCRIBE_MODEL


const subjects = {
  'landscape': {
    a_prompt: 'trending on artstation, by Greg Rutkowski and James Gurney',
    n_prompt: 'cropped',
  },
  'portrait': {
    a_prompt: 'by Artgerm and WLOP, concept art, trending on artstation',
    n_prompt: 'bad anatomy, bad hands, longbody, missing fingers, extra digit, cropped',
  },
}

const styles = {
  'oil painting': {
    a_prompt: 'oil painting, oil on canvas, best quality, highly detailed, awardwinning, amazing, HQ, 8k',
    n_prompt: 'worst quality, low quality, text, watermark, lowres',
  },
  'abstract': {
    a_prompt: 'abstract painting, mixed media, on canvas, highly detailed, 8k',
    n_prompt: 'worst quality, low quality, text, watermark, lowres',
  },
  'photograph': {
    a_prompt: 'photograph, f1.2 100mm ISO 100, best quality, highly detailed, awardwinning, amazing, HQ, 8k',
    n_prompt: 'worst quality, low quality, text, watermark, lowres',
  },
  'pixel art': {
    a_prompt: 'pixel art, by eBoy and AlbertoV, best quality, highly detailed, Pixel Studio, pixelation, awardwinning, amazing, HQ, 8k',
    n_prompt: 'worst quality, low quality, text, watermark, lowres',
  },
}

const sampleprompt = {
  normal: "a happy turtle on the beach",
  expert: "oil painting of a happy turtle on the beach, highly detailed, trending on artstation, 8k",  
}

const panelmargin = 16

const get_headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Token ${replToken}`
}

function getPercentFromLogs(logs) {
  if (!logs) { return 0 }
  const index = logs.lastIndexOf('%')
  if (index != -1) {
      return +logs.substr(index-3, 3)
  }
}



function Homepage() {
  const [status, setStatus] = useState('ready')
  const [percent, setPercent] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ w:512, h:512 })
  const [mode, setMode] = useState('normal')
  const [subject, setSubject] = useState('landscape')
  const [style, setStyle] = useState('oil painting')
  const promptRef = useRef('')
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const controlsRef = useRef(null)

  function resizeCanvas() {
    if (canvasContainerRef?.current) {
      const dw = window.innerWidth || doc.documentElement.clientWidth || body.clientWidth
      const dh = window.innerHeight || doc.documentElement.clientHeight || body.clientHeight
      const ch = controlsRef?.current.clientHeight + panelmargin * 2
      const squaresize = Math.min(dw, dh - ch)
      setCanvasSize({w: squaresize, h: squaresize})
    }
  }

  // resize convas on window resize
  // useLayoutEffect(() => {
  //   window.addEventListener('resize', resizeCanvas)
  //   resizeCanvas()
  //   return () => window.removeEventListener('resize', resizeCanvas)
  // }, [])
  // resize canvas once when loaded
  useEffect(() => {
    resizeCanvas()
  }, [])


  // brush options
  let brushColor = 'rgba(10,10,10, 0.6)'
  let brushSize = 2


  function resetCanvas() {
    const context = canvasRef.current.getContext('2d')
    context.clearRect(0, 0, canvasSize.w, canvasSize.h)
    setPercent(0)
    promptRef.current.value = ''
    setStatus('ready')
  }

  function changeMode(eventKey, event) {
    setMode(event.target.innerHTML.toLowerCase())
    console.info(`Changed mode to ${event.target.innerHTML}`)
  }
  function changeSubject(eventKey, event) {
    setSubject(event.target.innerHTML.toLowerCase())
    console.info(`Changed subject to ${event.target.innerHTML}`)
  }
  function changeStyle(eventKey, event) {
    setStyle(event.target.innerHTML.toLowerCase())
    console.info(`Changed style to ${event.target.innerHTML}`)
  }

  function getPrompt(target) {
    if (mode === 'expert') { return '' }
    return subjects[subject][target].concat(", ", styles[style][target])
  }

  function showImage(image_url) {
    const image = new Image()
    image.src = image_url
    image.crossOrigin = "anonymous"
    image.onload = () => {
      const context = canvasRef.current.getContext('2d')
      context.drawImage(image, 0, 0, canvasSize.w, canvasSize.h);
    }
  }


  /* CAPTIONING */
  // THIS TAKES WAY TOO LONG!
  async function describe(e) {
    e.preventDefault()
    e.stopPropagation()
    // --------------------------------------
    // POST request to the captioning model
    // --------------------------------------
    setStatus('POST')
    let response = null
    const dataURL = canvasRef.current.toDataURL("image/jpeg", 1.0)
    let req_body =  JSON.stringify({
        "version": `${replDescribeModel}`,
        "input": {
          image: dataURL,
        }
      })
    req_body = req_body.replace(/\\n/g, '') // TODO: check if this is needed
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${replToken}`
      },
      body: req_body
    }
    try {
      response = await fetch(lambdafunction, options).then((res) => {
        return res.json()
      })
      console.log('response', response)
      // promptRef.current.value = response
    } catch (error) {
      // TODO
      console.log(error)
      return
    }
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

  /* POLLING */
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


  /* GENERATE */
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
        "version": `${replGenModel}`,
        "input": {
          image: dataURL,
          prompt,
          image_resolution: '512',
          ddim_steps: 50,
          scale: 9, // guidance scale
          eta: 0, // DDIM
          a_prompt: getPrompt('a_prompt'), // additional prompts
          n_prompt: getPrompt('n_prompt'), // negative prompts
        }
      })
    req_body = req_body.replace(/\\n/g, '') // TODO: check if this is needed
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${replToken}`
      },
      body: req_body
    }
    try {
      response = await fetch(lambdafunction, options).then((res) => {
        return res.json()
      })
      console.log('response', response)
    } catch (error) {
      // TODO
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

    pollUntilCompleted(prediction_id)

  } // generate

  console.log('Running sketch.jsx')

  console.log('Drawing', Drawing)

  return (
    <div className="App">

      <section style={{marginBottom:0, paddingBottom:0}}>
        <div style={{position: 'relative'}} ref={canvasContainerRef}>
          <Loading
            percent={percent}
            height={canvasSize.h}
            width={canvasSize.w}
            visible={status !== 'ready' && status !== 'succeeded'}
          />
          <Drawing
            ref={canvasRef}
            brush={brushArc({
                fillStyle: 'black',
                size: brushSize,
              })}
            height={canvasSize.h}
            width={canvasSize.w}
          />
        </div>
      </section>

      <div ref={controlsRef} className="mt-3 mb-3">
        <Form>
          <Form.Group className="mb-3">
            <Form.Control
              ref={promptRef}
              id="prompt"
              as={mode === 'easy' ? "div" : "textarea"}
              rows={3}
              placeholder={`E.g., ${sampleprompt[mode]}`}
              aria-describedby="helpBlock"
              style={{
                height: '80px',
                color: mode === 'easy' ? "#FFFFFF" : null,
                backgroundColor: mode === 'easy' ? "#666666" : null
              }}
            />
          </Form.Group>
          <div>
            <Button
              onClick={mode === 'easy' ? describe : generate}
              disabled={status !== 'ready' && status !== 'succeeded'}
              variant="warning"
              type="submit"
              style={{marginRight: '8px'}}
            >
              Generate
            </Button>
            <Dropdown onSelect={changeMode} style={{marginRight: '8px', display: 'inline-block'}}>
              <Dropdown.Toggle variant="light" id="dropdown-basic">
                Mode
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {/*
                <Dropdown.Item active={mode === 'easy'} eventKey="1">Easy</Dropdown.Item>
                */}
                <Dropdown.Item active={mode === 'normal'}  eventKey="2">Normal</Dropdown.Item>
                <Dropdown.Item active={mode === 'expert'}  eventKey="3">Expert</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {
              mode === 'normal' && <>
                <Dropdown onSelect={changeSubject} style={{marginRight: '8px', display: 'inline-block'}}>
                  <Dropdown.Toggle variant="primary" id="dropdown-basic">
                    Subject
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item active={subject === 'landscape'} eventKey="1">Landscape</Dropdown.Item>
                    <Dropdown.Item active={subject === 'portrait'}  eventKey="2">Portrait</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown onSelect={changeStyle} style={{marginRight: '8px', display: 'inline-block'}}>
                  <Dropdown.Toggle variant="primary" id="dropdown-basic">
                    Style
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item active={style === 'oil painting'} eventKey="1">Oil Painting</Dropdown.Item>
                    <Dropdown.Item active={style === 'abstract'} eventKey="2">Abstract</Dropdown.Item>
                    <Dropdown.Item active={style === 'photograph'} eventKey="3">Photograph</Dropdown.Item>
                    <Dropdown.Item active={style === 'pixel art'} eventKey="4">Pixel Art</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            }
            <Button onClick={resetCanvas} variant="light" >
              <ArrowRepeat /> Reset
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default Homepage
