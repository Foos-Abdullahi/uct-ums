<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = Program::all()->keyBy('name');

        $swe = $programs->first(fn ($p) => str_contains($p->name, 'Software Engineering'));
        $net = $programs->first(fn ($p) => str_contains($p->name, 'Networking'));
        $anm = $programs->first(fn ($p) => str_contains($p->name, 'Animation'));

        $courses = [
            // Software Engineering
            [
                'code' => 'SWE101',
                'name' => 'Fundamentals of Software Engineering',
                'credit_hours' => 3,
                'semester' => 1,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'Introduction to software engineering principles, lifecycle models, and agile practices.',
                'status' => 'active',
            ],
            [
                'code' => 'CS101',
                'name' => 'Introduction to Computer Science',
                'credit_hours' => 3,
                'semester' => 1,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'Foundational computing concepts, algorithms, and programming with Python.',
                'status' => 'active',
            ],
            [
                'code' => 'SWE201',
                'name' => 'Data Structures & Algorithms',
                'credit_hours' => 4,
                'semester' => 2,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'In-depth study of arrays, linked lists, trees, graphs, sorting, and search algorithms.',
                'status' => 'active',
            ],
            [
                'code' => 'SWE202',
                'name' => 'Object Oriented Programming',
                'credit_hours' => 3,
                'semester' => 2,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'OOP principles including encapsulation, inheritance, polymorphism, and design patterns.',
                'status' => 'active',
            ],
            [
                'code' => 'SWE301',
                'name' => 'Software Architecture & Design',
                'credit_hours' => 3,
                'semester' => 3,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'Architectural patterns, microservices, system modeling, and component design.',
                'status' => 'active',
            ],
            [
                'code' => 'SWE302',
                'name' => 'Database Management Systems',
                'credit_hours' => 3,
                'semester' => 3,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'Relational database design, SQL querying, indexing, and NoSQL storage systems.',
                'status' => 'active',
            ],
            [
                'code' => 'SWE303',
                'name' => 'Web Application Development',
                'credit_hours' => 3,
                'semester' => 4,
                'level' => 'undergraduate',
                'program_id' => $swe?->id,
                'description' => 'Modern fullstack web engineering with REST APIs, React, and Laravel.',
                'status' => 'active',
            ],

            // Networking & Cyber Security
            [
                'code' => 'NET101',
                'name' => 'Computer Networks Fundamentals',
                'credit_hours' => 3,
                'semester' => 1,
                'level' => 'undergraduate',
                'program_id' => $net?->id,
                'description' => 'OSI & TCP/IP stack, Ethernet, IP addressing, subnetting, and network protocols.',
                'status' => 'active',
            ],
            [
                'code' => 'NET201',
                'name' => 'Routing & Switching Technologies',
                'credit_hours' => 3,
                'semester' => 2,
                'level' => 'undergraduate',
                'program_id' => $net?->id,
                'description' => 'Configuration of enterprise routers, switches, VLANs, and OSPF routing protocols.',
                'status' => 'active',
            ],
            [
                'code' => 'SEC201',
                'name' => 'Network Security & Firewalls',
                'credit_hours' => 3,
                'semester' => 3,
                'level' => 'undergraduate',
                'program_id' => $net?->id,
                'description' => 'Network perimeter defense, intrusion prevention, VPNs, and firewall configuration.',
                'status' => 'active',
            ],
            [
                'code' => 'SEC402',
                'name' => 'Cyber Security Principles',
                'credit_hours' => 4,
                'semester' => 4,
                'level' => 'undergraduate',
                'program_id' => $net?->id,
                'description' => 'Information security standards, ethical hacking, vulnerability management, and defense.',
                'status' => 'active',
            ],

            // Animation & Visual Effects
            [
                'code' => 'ANM101',
                'name' => 'Digital Art & 2D Animation',
                'credit_hours' => 3,
                'semester' => 1,
                'level' => 'undergraduate',
                'program_id' => $anm?->id,
                'description' => 'Principles of animation, storyboard creation, character design, and raster illustration.',
                'status' => 'active',
            ],
            [
                'code' => 'ANM201',
                'name' => '3D Modeling & Texturing',
                'credit_hours' => 4,
                'semester' => 2,
                'level' => 'undergraduate',
                'program_id' => $anm?->id,
                'description' => 'Polygon modeling, UV mapping, shading, lighting, and rendering pipelines.',
                'status' => 'active',
            ],
        ];

        foreach ($courses as $courseData) {
            Course::query()->updateOrCreate(
                ['code' => $courseData['code']],
                $courseData
            );
        }
    }
}
