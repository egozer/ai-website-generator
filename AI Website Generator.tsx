"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, MessageCircle, Sparkles } from "lucide-react"

interface ChatMessage {
  id: number
  type: "question" | "answer" | "system"
  content: string
  options?: string[]
  questionKey?: keyof WizardAnswers
  multiple?: boolean
  freeText?: boolean
  answered?: boolean
}

interface WizardAnswers {
  businessType: string
  colors: string
  layout: string
  sections: string[]
  style: string
  additionalFeatures: string
}

const questions = [
  {
    id: 1,
    question: "What type of business or website is this for?",
    key: "businessType" as keyof WizardAnswers,
    options: ["Restaurant", "Tech Startup", "Portfolio", "E-commerce", "Blog", "Agency", "Other"],
  },
  {
    id: 2,
    question: "What color scheme would you prefer?",
    key: "colors" as keyof WizardAnswers,
    options: ["Blue & White", "Dark & Modern", "Warm & Earthy", "Bright & Colorful", "Minimalist Gray", "Custom"],
  },
  {
    id: 3,
    question: "What layout style do you prefer?",
    key: "layout" as keyof WizardAnswers,
    options: ["Single Page", "Multi-section Landing", "Grid-based", "Sidebar Navigation", "Full-width Hero"],
  },
  {
    id: 4,
    question: "Which sections should your website include?",
    key: "sections" as keyof WizardAnswers,
    options: [
      "Header/Navigation",
      "Hero Section",
      "About Us",
      "Services/Products",
      "Testimonials",
      "Contact Form",
      "Footer",
    ],
    multiple: true,
  },
  {
    id: 5,
    question: "What overall style are you aiming for?",
    key: "style" as keyof WizardAnswers,
    options: ["Professional", "Creative", "Modern", "Classic", "Playful", "Elegant"],
  },
  {
    id: 6,
    question: "Any additional features or specific requirements?",
    key: "additionalFeatures" as keyof WizardAnswers,
    freeText: true,
  },
]

export default function WebsiteGenerator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      type: "system",
      content:
        "Hi! I'm your AI website generator. I'll ask you a few questions to understand what kind of website you want, then create it for you instantly! Let's get started.",
    },
  ])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({
    businessType: "",
    colors: "",
    layout: "",
    sections: [],
    style: "",
    additionalFeatures: "",
  })

  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [customInput, setCustomInput] = useState("")
  const [finalPrompt, setFinalPrompt] = useState("")
  const [showPromptConfirmation, setShowPromptConfirmation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  React.useEffect(() => {
    if (currentQuestionIndex === 0 && messages.length === 1) {
      setTimeout(() => {
        addQuestion(0)
      }, 1000)
    }
  }, [])

  const addQuestion = (questionIndex: number) => {
    if (questionIndex < questions.length) {
      const question = questions[questionIndex]
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          type: "question",
          content: question.question,
          options: question.options,
          questionKey: question.key,
          multiple: question.multiple,
          freeText: question.freeText,
          answered: false,
        },
      ])
    }
  }

  const handleAnswer = (answer: string | string[], questionKey: keyof WizardAnswers) => {
    setMessages((prev) =>
      prev
        .map((msg, index) => (index === prev.length - 1 && msg.type === "question" ? { ...msg, answered: true } : msg))
        .concat([
          {
            id: prev.length,
            type: "answer",
            content: Array.isArray(answer) ? answer.join(", ") : answer,
          },
        ]),
    )

    setAnswers((prev) => ({
      ...prev,
      [questionKey]: answer,
    }))

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setTimeout(() => {
        addQuestion(nextIndex)
      }, 500)
    } else {
      setTimeout(() => {
        generateFinalPrompt({ ...answers, [questionKey]: answer })
      }, 500)
    }
  }

  const handleOptionClick = (option: string, questionKey: keyof WizardAnswers, isMultiple?: boolean) => {
    if (isMultiple) {
      const newSections = selectedSections.includes(option)
        ? selectedSections.filter((s) => s !== option)
        : [...selectedSections, option]
      setSelectedSections(newSections)
    } else {
      handleAnswer(option, questionKey)
    }
  }

  const handleMultipleSubmit = (questionKey: keyof WizardAnswers) => {
    handleAnswer(selectedSections, questionKey)
    setSelectedSections([])
  }

  const handleCustomSubmit = (questionKey: keyof WizardAnswers) => {
    if (customInput.trim()) {
      handleAnswer(customInput.trim(), questionKey)
      setCustomInput("")
    }
  }

  const generateFinalPrompt = (finalAnswers: WizardAnswers) => {
    const sectionsText = Array.isArray(finalAnswers.sections) ? finalAnswers.sections.join(", ") : finalAnswers.sections

    const prompt = `Create a complete, professional, all-in-one HTML website for a ${finalAnswers.businessType} business. 

Design Requirements:
- Color scheme: ${finalAnswers.colors}
- Layout style: ${finalAnswers.layout}
- Overall style: ${finalAnswers.style}
- Include these sections: ${sectionsText}
- Additional features: ${finalAnswers.additionalFeatures || "None specified"}

Technical Requirements:
- Single HTML file with embedded CSS and JavaScript
- Fully responsive design that works on all devices
- Modern, clean, and professional appearance
- Include placeholder content that's relevant to the business type
- Use modern CSS features like flexbox/grid for layout
- Include smooth scrolling and subtle animations
- Optimize for fast loading and good user experience
- Include proper meta tags and semantic HTML structure

Make it look professional and ready to use immediately. Include realistic placeholder content, images (use placeholder image services), and make sure all sections flow together cohesively.`

    setFinalPrompt(prompt)
    setShowPromptConfirmation(true)

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length,
        type: "system",
        content:
          "Perfect! I've analyzed your requirements and created a detailed prompt for your website. Please review it below and click 'Generate Website' when you're ready!",
      },
    ])
  }

  const generateWebsite = async () => {
    setIsGenerating(true)
    setShowPromptConfirmation(false)

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length,
        type: "system",
        content: "🚀 Generating your website... This may take a moment!",
      },
    ])

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Website Generator",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1:free",
          messages: [
            {
              role: "user",
              content: finalPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const htmlContent = data.choices[0].message.content
      setGeneratedHtml(htmlContent)
      setShowPreview(true)
      setIsGenerating(false)

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          type: "system",
          content:
            "✨ Your website has been generated successfully! You can see the live preview below and download the HTML file.",
        },
      ])
    } catch (error) {
      console.error("Error generating website:", error)
      setIsGenerating(false)
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          type: "system",
          content: "❌ Sorry, there was an error generating your website. Please try again.",
        },
      ])
    }
  }

  const downloadHtml = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-website.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetGenerator = () => {
    setMessages([
      {
        id: 0,
        type: "system",
        content:
          "Hi! I'm your AI website generator. I'll ask you a few questions to understand what kind of website you want, then create it for you instantly! Let's get started.",
      },
    ])
    setCurrentQuestionIndex(0)
    setAnswers({
      businessType: "",
      colors: "",
      layout: "",
      sections: [],
      style: "",
      additionalFeatures: "",
    })
    setSelectedSections([])
    setCustomInput("")
    setFinalPrompt("")
    setShowPromptConfirmation(false)
    setIsGenerating(false)
    setGeneratedHtml("")
    setShowPreview(false)

    setTimeout(() => {
      addQuestion(0)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-blue-600" />
            AI Website Generator
          </h1>
          <p className="text-gray-600">Create a professional website in minutes with AI</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Website Builder Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px] max-h-[600px]">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "answer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        message.type === "answer"
                          ? "bg-blue-600 text-white"
                          : message.type === "system"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {message.options && message.type === "question" && !message.answered && (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {message.options.map((option) => (
                              <Button
                                key={option}
                                variant={selectedSections.includes(option) ? "default" : "outline"}
                                size="sm"
                                className="text-xs"
                                onClick={() => handleOptionClick(option, message.questionKey!, message.multiple)}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>

                          {message.multiple && (
                            <Button
                              onClick={() => handleMultipleSubmit(message.questionKey!)}
                              disabled={selectedSections.length === 0}
                              className="w-full mt-2"
                              size="sm"
                            >
                              Continue with Selected ({selectedSections.length})
                            </Button>
                          )}
                        </div>
                      )}

                      {message.freeText && message.type === "question" && !message.answered && (
                        <div className="mt-3 space-y-2">
                          <Input
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Type your answer here..."
                            onKeyPress={(e) => e.key === "Enter" && handleCustomSubmit(message.questionKey!)}
                            className="text-sm"
                          />
                          <Button
                            onClick={() => handleCustomSubmit(message.questionKey!)}
                            disabled={!customInput.trim()}
                            className="w-full"
                            size="sm"
                          >
                            Submit Answer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex justify-center">
                    <div className="bg-blue-100 text-blue-800 p-4 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating your website...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {showPromptConfirmation && (
                <div className="border-t pt-4 flex-shrink-0">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{finalPrompt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={generateWebsite} className="flex-1">
                      Generate Website
                    </Button>
                    <Button variant="outline" onClick={resetGenerator}>
                      Start Over
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <span>Website Preview</span>
                {generatedHtml && (
                  <Button onClick={downloadHtml} size="sm" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download HTML
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              {showPreview && generatedHtml ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={generatedHtml}
                  className="w-full h-full min-h-[400px] border-0 rounded-b-lg"
                  title="Generated Website Preview"
                />
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Your website preview will appear here</p>
                    <p className="text-sm mt-2">Complete the chat to generate your site</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showPreview && (
          <div className="mt-6 text-center">
            <Button onClick={resetGenerator} variant="outline" size="lg">
              Create Another Website
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
