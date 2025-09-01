"use client";
import axios from "axios";
import React, { useState } from "react";

const Contact = () => {
    const [formData, setFormData] = useState({
        email: "",
        subject: "",
        message: ""
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        // Clear error when user types
        if (errors[id]) {
            setErrors(prev => ({
                ...prev,
                [id]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }
        if (!formData.subject) {
            newErrors.subject = "Subject is required";
        }
        if (!formData.message) {
            newErrors.message = "Message is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        
        try {
            
            const res= await axios.post("/api/contact", formData);
            if (res.status === 200) {
                setMessageSent(true);
                setFormData({ email: "", subject: "", message: "" });
            }
                  
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-md border border-border">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
                    <p className="text-muted-foreground">Have questions? Fill out the form below and we'll get back to you soon.</p>
                </div>

                {messageSent && (
                    <div className="mb-6 p-4 bg-green-500/10 text-green-600 rounded-md">
                        Thank you! Your message has been sent successfully.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full border ${errors.email ? 'border-destructive' : 'border-border'} rounded-md py-2 px-4 outline-none bg-background text-foreground placeholder-muted-foreground`}
                            placeholder="your@email.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="mb-4">
                        <input
                            id="subject"
                            type="text"
                            value={formData.subject}
                            onChange={handleChange}
                            className={`w-full border ${errors.subject ? 'border-destructive' : 'border-border'} rounded-md py-2 px-4 outline-none bg-background text-foreground placeholder-muted-foreground`}
                            placeholder="What's this about?"
                        />
                        {errors.subject && <p className="mt-1 text-sm text-destructive">{errors.subject}</p>}
                    </div>

                    <div className="mb-6">

                        <textarea
                            id="message"
                            rows="4"
                            value={formData.message}
                            onChange={handleChange}
                            className={`w-full border ${errors.message ? 'border-destructive' : 'border-border'} rounded-md py-2 px-4 outline-none bg-background text-foreground placeholder-muted-foreground`}
                            placeholder="Your message here..."
                        ></textarea>
                        {errors.message && <p className="mt-1 text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full text-primary-foreground py-2 px-4 rounded-md bg-gradient-to-r from-primary to-primary/80 cursor-pointer hover:shadow-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </span>
                        ) : "Send Message"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Contact;