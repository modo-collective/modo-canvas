"use client"

import { useState } from "react"
import Canvas from "@/components/Canvas"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Upload, Save, Clock } from "lucide-react"

const fileTypes = [
  { value: "png", label: "PNG", mimeType: "image/png" },
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg" },
  { value: "webp", label: "WebP", mimeType: "image/webp" },
]

export default function Home() {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedFileType, setSelectedFileType] = useState("png")
  const [fileName, setFileName] = useState("")

  const handleSave = (saveFunction: () => void) => {
    saveFunction()
    setIsSaveDialogOpen(false)
    setFileName("")
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
            <input type="file" id="imageUpload" accept="image/*" className="hidden" />
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
                      placeholder="modo_drawing"
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
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={() => setIsHistoryDialogOpen(true)}>
              <Clock className="w-4 h-4" />
              <span className="sr-only">View History</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        <Canvas
          isSaveDialogOpen={isSaveDialogOpen}
          isHistoryDialogOpen={isHistoryDialogOpen}
          setIsHistoryDialogOpen={setIsHistoryDialogOpen}
          selectedFileType={selectedFileType}
          fileName={fileName}
          onSave={handleSave}
        />
      </main>

      <footer className="bg-gray-100 p-4 border-t border-gray-200">
        <div className="container mx-auto text-center text-sm text-gray-600">
          © 2025 Modo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}