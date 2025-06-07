'use client'

import { FC, useEffect, useState } from 'react'
import { useDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'

import { io } from 'socket.io-client'
import { drawLine } from '../utils/drawLine'
const socket = io('http://localhost:3001')

interface pageProps {}

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

const page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>('#000')
  const { canvasRef, onMouseDown, clear } = useDraw(createLine)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      console.log('sending canvas state')
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('I received the state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return console.log('no ctx here')
      drawLine({ prevPoint, currentPoint, ctx, color })
    })

    socket.on('clear', clear)

    return () => {
      socket.off('draw-line')
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('clear')
    }
  }, [canvasRef])

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', { prevPoint, currentPoint, color })
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  return (
    <div className='w-screen h-screen bg-slate-200 flex justify-center items-center'>
      {/* SideBar */}
      <div className='flex flex-col gap-10 pr-10 justify-center items-center'>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
              src="/Pixo.png"
              className="w-20 h-auto"
          />
        </div>


        {/* Color Palette */}
        <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
        
        {/* Clear Button */}
        <button
          type='button'
          className='w-full h-9 rounded-md border border-red-700 bg-red-600 text-white hover:bg-red-700 transition-colors'
          onClick={() => socket.emit('clear')}>
          Clear
        </button>

      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        width={750}
        height={750}
        className='border border-black rounded-md bg-white'
      />
    </div>
  )
}

export default page