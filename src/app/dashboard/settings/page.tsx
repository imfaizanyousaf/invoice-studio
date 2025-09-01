"use client";
import { useUser } from '@/context/UserContext';
import { PlusCircleIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SettingsPage = () => {
    const { user } = useUser();

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: ""
    });
    const [isEditing, setIsEditing] = useState(false);

    

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle Cancel Button
    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            password: ""
        });
    };

    // Handle Save Changes
    const handleSave = async () => {
        setIsEditing(true);
        try {
            const response = await axios.patch('/api/auth/update', {
                userId: user.userId || user._id, // Ensure this matches the user ID in your context
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (response.data) {
                toast.success('Profile updated successfully!');
                // Optionally, update the user context with the new data
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }finally {
            setIsEditing(false);
        }
    };

    return (
        <div className='flex flex-col w-full max-w-[800px] py-4 h-full'>
            <p className='text-white font-bold mb-4'>Personal Information</p>

            <div className='flex flex-col md:flex-row items-start md:items-center gap-4'>
                {/* Form Section */}
                <div className='flex flex-col w-full h-full gap-4'>
                    <input
                        type='text'
                        name='name'
                        placeholder='Full Name'
                        value={formData.name}
                        onChange={handleChange}
                        className='w-full bg-[#217DFE05] outline-none border border-[#0093E829] rounded-md p-2'
                    />
                    <input
                        type='text'
                        name='email'
                        placeholder='Email'
                        value={formData.email}
                        onChange={handleChange}
                        className='w-full bg-[#217DFE05] outline-none border border-[#0093E829] rounded-md p-2'
                    />
                    <input
                        type='password'
                        name='password'
                        placeholder='Password'
                        value={formData.password}
                        onChange={handleChange}
                        className='w-full bg-[#217DFE05] outline-none border border-[#0093E829] rounded-md p-2'
                    />

                    <div className='flex items-center gap-2'>
                        <button
                            type='submit'
                            disabled={isEditing}
                            className='bg-gradient-to-r from-[#21ABFD] to-[#0055DE] text-white font-bold rounded-full px-4 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                        <button 
                            className='rounded-md p-2 cursor-pointer'
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;