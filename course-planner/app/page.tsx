// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Wand2, ChevronDown, X, Plus, Trash2, Search } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

export default function Home() {
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const { courses, loading, error, searchCourses } = useCourses();
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasSearched(true);
    await searchCourses(searchQuery);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">School/College</label>
              <select className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1">
                <option value="">Select School/College</option>
                <option value="L&S">College of Letters & Science</option>
                <option value="ENGR">College of Engineering</option>
                <option value="BUS">School of Business</option>
                <option value="CDIS">School of Computer, Data & Information Sciences</option>
                <option value="EDUC">School of Education</option>
                <option value="CALS">College of Agricultural & Life Sciences</option>
                <option value="SOHE">School of Human Ecology</option>
                <option value="NURS">School of Nursing</option>
              </select>

              <select className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1">
                <option value="">Select Major/Program</option>
                <option value="CS">Computer Sciences, BS</option>
                <option value="DS">Data Science, BS</option>
                <option value="STAT">Statistics, BS</option>
                <option value="MATH">Mathematics, BS</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Academic Status</label>
              <div className="flex space-x-4">
                <select className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1">
                  <option value="">Class Standing</option>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                </select>
                
                <select className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1">
                  <option value="">Graduation Year</option>
                  <option>2028</option>
                  <option>2027</option>
                  <option>2026</option>
                  <option>2025</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1">
                  <option>Prioritize A Grade %</option>
                  <option>Balance Workload</option>
                  <option>Mix Required/Electives</option>
                </select>
                <button 
                  className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 shadow-sm"
                  onClick={() => setIsPlanGenerated(true)}
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Auto Fill Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by name, number, or instructor"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {/* Course List */}
          <div className="space-y-2">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500">
                Failed to load courses. Please try again.
              </div>
            )}

            {!hasSearched && (
              <div className="text-center py-8 text-gray-500">
                Search for courses to begin
              </div>
            )}
            {hasSearched && !loading && !error && courses.map((course) => (
              <div 
                key={course.id}
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{course.code}</h3>
                      <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full text-gray-600">
                        {course.credits} credits
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600">{course.name}</p>
                    {course.description && (
                      <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                  {course.gradeDistribution && (
  <div className="text-sm text-green-600 font-medium">
    A: {JSON.parse(course.gradeDistribution).A}%
  </div>
)}
                    <div className="text-sm text-gray-500 mt-1">
                      {course.term.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {/* Auto Fill Preview Banner */}
        {isPlanGenerated && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Wand2 className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">4-Year Plan Generated</h3>
                  <p className="text-sm text-gray-600">
                    Optimized for highest A grade probability while meeting all requirements
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  View Details
                </button>
                <button className="text-sm text-blue-500 font-medium hover:text-blue-600">
                  Apply Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Year Selector Pills */}
        <div className="flex space-x-2 mb-8">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium">Freshman</button>
          <button className="px-4 py-2 hover:bg-gray-50 text-gray-600 rounded-md">Sophomore</button>
          <button className="px-4 py-2 hover:bg-gray-50 text-gray-600 rounded-md">Junior</button>
          <button className="px-4 py-2 hover:bg-gray-50 text-gray-600 rounded-md">Senior</button>
        </div>

        {/* Academic Years */}
        <div className="space-y-8">
          {['Freshman Year (2024-2025)', 'Sophomore Year (2025-2026)', 'Junior Year (2026-2027)', 'Senior Year (2027-2028)'].map((year, yearIndex) => (
            <div key={yearIndex} className="border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">{year}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Total Credits: 30/30</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid md:grid-cols-3 gap-6">
                  {['Fall', 'Summer', 'Spring'].map((semester, semIndex) => (
                    <div key={semIndex} className="border border-gray-200 rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {`${semester} ${2024 + yearIndex}`}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">12.00 credits</span>
                            <button 
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Clear All Courses"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors relative">
                            {i === 0 && semIndex === 0 && yearIndex === 0 ? (
                              <div>
                                <button 
                                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                  title="Remove Course"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="flex justify-between pr-6">
                                  <div>
                                    <h3 className="font-medium text-gray-900">COMP SCI 540</h3>
                                    <p className="text-sm text-gray-500">Intro Artificial Intelligence</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-900">3.00 Cr</div>
                                    <div className="text-sm text-green-600 font-medium">A: 45.2%</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center items-center min-h-[60px]">
                                <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-600">
                                  <Plus className="h-4 w-4" />
                                  <span>Add Course</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Saved for later */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Saved for later</h2>
            <div className="flex items-center space-x-4">
              <button className="text-sm text-red-500 hover:text-red-600 flex items-center space-x-1">
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
              <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                <option>Highest A %</option>
                <option>Required First</option>
                <option>Credits</option>
              </select>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors relative">
                  {i === 0 && (
                    <>
                      <button 
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        title="Remove from Saved"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex justify-between items-center pr-6">
                        <div>
                          <h3 className="font-medium text-gray-900">ENGL 153</h3>
                          <p className="text-sm text-gray-500">Literature and the Environment</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-green-600 font-medium">A: 52.1%</span>
                          <button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                            Add to Schedule
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}