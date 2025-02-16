"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Plus, Undo2, Upload, Save, Clock } from "lucide-react"

const brushTypes = ["Pencil", "Watercolor", "Chalk", "Spray", "Texture", "Eraser"]
const fileTypes = [
  { value: "png", label: "PNG", mimeType: "image/png" },
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg" },
  { value: "webp", label: "WebP", mimeType: "image/webp" },
]

interface DrawingVersion {
  timestamp: number
  imageData: string
}

interface Drawing {
  id: number
  name: string
  history: DrawingVersion[]
  backgroundImage: string | null
}

export default function Modo() {
  const [drawings, setDrawings] = useState<Drawing[]>([
    { id: 1, name: "Drawing 1", history: [], backgroundImage: null },
  ])
  const [currentDrawingId, setCurrentDrawingId] = useState(1)
  const [brushType, setBrushType] = useState("Pencil")
  const [color, setColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(2)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedFileType, setSelectedFileType] = useState("png")
  const [editingDrawingId, setEditingDrawingId] = useState<number | null>(null)
  const [fileName, setFileName] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineCap = "round"
        ctxRef.current = ctx

        // Draw initial white background
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color
      ctxRef.current.lineWidth = lineWidth
    }
  }, [color, lineWidth])

  useEffect(() => {
    loadDrawing(currentDrawingId)
  }, [currentDrawingId])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault()
      undo()
    } else if (e.ctrlKey && e.key === "s") {
      e.preventDefault()
      setIsSaveDialogOpen(true)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasRef.current && ctxRef.current) {
      ctxRef.current.beginPath()
      ctxRef.current.moveTo(
        e.nativeEvent.offsetX * (800 / canvasRef.current.offsetWidth),
        e.nativeEvent.offsetY * (600 / canvasRef.current.offsetHeight),
      )
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1 || !ctxRef.current || !canvasRef.current) return
    const ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    const canvas = canvasRef.current
    const x = e.nativeEvent.offsetX * (800 / canvas.offsetWidth)
    const y = e.nativeEvent.offsetY * (600 / canvas.offsetHeight)

    switch (brushType) {
      case "Pencil":
        ctx.lineTo(x, y)
        ctx.stroke()
        break
      case "Watercolor":
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          ctx.arc(x + Math.random() * 10 - 5, y + Math.random() * 10 - 5, Math.random() * 5, 0, Math.PI * 2)
          ctx.fillStyle = color + "40" // Add transparency
          ctx.fill()
        }
        break
      case "Chalk":
        for (let i = 0; i < 20; i++) {
          ctx.beginPath()
          ctx.arc(
            x + Math.random() * lineWidth - lineWidth / 2,
            y + Math.random() * lineWidth - lineWidth / 2,
            Math.random() * 2,
            0,
            Math.PI * 2,
          )
          ctx.fillStyle = color
          ctx.fill()
        }
        break
      case "Spray":
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * lineWidth
          ctx.beginPath()
          ctx.arc(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 0.5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
        }
        break
      case "Texture":
        const img = new Image()
        img.src = "/placeholder.svg?height=50&width=50" // Replace with actual texture image
        img.onload = () => {
          const pattern = ctx.createPattern(img, "repeat")
          if (pattern) {
            ctx.strokeStyle = pattern
            ctx.lineTo(x, y)
            ctx.stroke()
            ctx.strokeStyle = color // Reset stroke style
          }
        }
        break
      case "Eraser":
        ctx.globalCompositeOperation = "destination-out"
        ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.globalCompositeOperation = "source-over"
        break
    }
  }

  const endDrawing = () => {
    saveCurrentDrawing()
  }

  const undo = () => {
    const currentDrawing = drawings.find((d) => d.id === currentDrawingId)
    if (currentDrawing && currentDrawing.history.length > 1 && ctxRef.current && canvasRef.current) {
      const previousVersion = currentDrawing.history[currentDrawing.history.length - 2]
      const img = new Image()
      img.onload = () => {
        ctxRef.current!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
        ctxRef.current!.drawImage(img, 0, 0)
      }
      img.src = previousVersion.imageData

      setDrawings(drawings.map((d) => (d.id === currentDrawingId ? { ...d, history: d.history.slice(0, -1) } : d)))
    }
  }

  const addDrawing = () => {
    const newDrawing: Drawing = {
      id: drawings.length + 1,
      name: `Drawing ${drawings.length + 1}`,
      history: [],
      backgroundImage: null,
    }
    setDrawings([...drawings, newDrawing])
    setCurrentDrawingId(newDrawing.id)
  }

  const saveDrawing = () => {
    if (canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      const selectedType = fileTypes.find((type) => type.value === selectedFileType)

      if (!selectedType) return

      let imageData: string
      if (selectedType.value === "jpeg") {
        // Create a temporary canvas to draw background and content
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          // Draw background
          drawBackground(tempCtx, tempCanvas)

          // Draw current canvas content
          tempCtx.drawImage(canvas, 0, 0)

          imageData = tempCanvas.toDataURL(selectedType.mimeType)
        } else {
          return
        }
      } else {
        // For PNG and WebP, use the canvas as is (transparent background)
        imageData = canvas.toDataURL(selectedType.mimeType)
      }

      // Save to user's device
      const link = document.createElement("a")
      link.download = `${fileName || `modo_drawing${currentDrawingId}`}.${selectedFileType}`
      link.href = imageData
      link.click()

      setIsSaveDialogOpen(false)
      setFileName("")
    }
  }

  const saveCurrentDrawing = () => {
    if (canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL()
      const newVersion: DrawingVersion = {
        timestamp: Date.now(),
        imageData: imageData,
      }
      setDrawings(
        drawings.map((drawing) =>
          drawing.id === currentDrawingId ? { ...drawing, history: [...drawing.history, newVersion] } : drawing,
        ),
      )
    }
  }

  const loadDrawing = (drawingId: number) => {
    saveCurrentDrawing()
    setCurrentDrawingId(drawingId)
    const drawing = drawings.find((d) => d.id === drawingId)
    if (drawing && ctxRef.current && canvasRef.current) {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (drawing.history.length > 0) {
        const latestVersion = drawing.history[drawing.history.length - 1]
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = latestVersion.imageData
      } else if (drawing.backgroundImage) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = drawing.backgroundImage
      } else {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && ctxRef.current && canvasRef.current) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const ctx = ctxRef.current
          const canvas = canvasRef.current
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            setDrawings(
              drawings.map((drawing) =>
                drawing.id === currentDrawingId
                  ? { ...drawing, backgroundImage: event.target?.result as string }
                  : drawing,
              ),
            )
            saveCurrentDrawing()
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const currentDrawing = drawings.find((d) => d.id === currentDrawingId)
    if (currentDrawing && currentDrawing.backgroundImage) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = currentDrawing.backgroundImage
    } else {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const renameDrawing = (id: number, newName: string) => {
    setDrawings(drawings.map((drawing) => (drawing.id === id ? { ...drawing, name: newName } : drawing)))
    setEditingDrawingId(null)
  }

  const restoreVersion = (version: DrawingVersion) => {
    if (ctxRef.current && canvasRef.current) {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        saveCurrentDrawing()
      }
      img.src = version.imageData
    }
    setIsHistoryDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <header className="bg-gray-100 p-4 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Modo Canvas</h1>
          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={() => document.getElementById("imageUpload")?.click()}>
              <Upload className="w-4 h-4" />
              <span className="sr-only">Upload Image</span>
            </Button>
            <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Save className="w-4 h-4" />
                  <span className="sr-only">Save Drawing</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Drawing</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label htmlFor="fileName">File Name</Label>
                    <input
                      type="text"
                      id="fileName"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder={`modo_drawing${currentDrawingId}`}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Choose file type:</h4>
                    <RadioGroup value={selectedFileType} onValueChange={setSelectedFileType}>
                      {fileTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={type.value} />
                          <Label htmlFor={type.value}>{type.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                <Button onClick={saveDrawing}>Save</Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Clock className="w-4 h-4" />
                  <span className="sr-only">View History</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Drawing History</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {drawings
                    .find((d) => d.id === currentDrawingId)
                    ?.history.map((version, index) => (
                      <div key={version.timestamp} className="flex items-center justify-between">
                        <span>
                          Version {index + 1} - {new Date(version.timestamp).toLocaleString()}
                        </span>
                        <Button onClick={() => restoreVersion(version)}>Restore</Button>
                      </div>
                    ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        <aside className="w-64 bg-gray-50 p-4 overflow-y-auto border-r border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Drawings</h2>
          <ul className="space-y-2">
            {drawings.map((drawing) => (
              <li key={drawing.id} className="flex items-center space-x-2">
                {editingDrawingId === drawing.id ? (
                  <input
                    type="text"
                    defaultValue={drawing.name}
                    onBlur={(e) => renameDrawing(drawing.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        renameDrawing(drawing.id, e.currentTarget.value)
                      }
                    }}
                    className="flex-grow p-1 text-sm border rounded"
                    autoFocus
                  />
                ) : (
                  <Button
                    variant={drawing.id === currentDrawingId ? "secondary" : "ghost"}
                    className="flex-grow justify-start text-gray-700"
                    onClick={() => loadDrawing(drawing.id)}
                  >
                    {drawing.name}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEditingDrawingId(drawing.id)} className="px-2">
                  ✏️
                  <span className="sr-only">Edit drawing name</span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button onClick={addDrawing} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Drawing
            </Button>
          </div>
        </aside>

        <section className="flex-1 p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              className="w-full h-auto cursor-crosshair"
              style={{ aspectRatio: "4/3" }}
            />
          </div>
        </section>

        <aside className="w-64 bg-gray-50 p-4 border-l border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Tools</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="brushType" className="block text-sm font-medium mb-1 text-gray-700">
                Brush Type
              </label>
              <Select onValueChange={setBrushType} defaultValue={brushType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brushTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-1 text-gray-700">
                Color
              </label>
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded border border-gray-300"
              />
            </div>
            <div>
              <label htmlFor="lineWidth" className="block text-sm font-medium mb-1 text-gray-700">
                Line Width
              </label>
              <Slider
                id="lineWidth"
                min={1}
                max={20}
                step={1}
                value={[lineWidth]}
                onValueChange={(value) => setLineWidth(value[0])}
              />
            </div>
            <Button variant="outline" size="icon" onClick={undo}>
              <Undo2 className="w-4 h-4" />
              <span className="sr-only">Undo</span>
            </Button>
          </div>
        </aside>
      </main>

      <footer className="bg-gray-100 p-4 border-t border-gray-200">
        <div className="container mx-auto text-center text-sm text-gray-600">
          © 2025 Modo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}