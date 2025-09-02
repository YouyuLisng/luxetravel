"use client"
import React from 'react'
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { Button } from '@/components/ui/button';

export default function Social() {
    return (
        <div className='flex items-center w-full gap-x-2'>
            <Button className='w-full' size="lg" variant="outline">
                <FcGoogle className='h-5 w-5' />
            </Button>
            <Button className='w-full' size="lg" variant="outline">
                <FaFacebook className='h-5 w-5 text-blue-600' />
            </Button>
        </div>
    )
}
