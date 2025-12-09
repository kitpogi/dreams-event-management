<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'client_name' => 'Jessica L.',
                'client_initials' => 'JL',
                'event_type' => 'Wedding',
                'rating' => 5,
                'message' => "D'Dreams turned our wedding into a fairytale. Every detail was perfect and beautifully executed.",
                'is_featured' => true,
            ],
            [
                'client_name' => 'Michael B.',
                'client_initials' => 'MB',
                'event_type' => 'Corporate Event',
                'rating' => 5,
                'message' => 'The most professional and creative team I have worked with. They exceeded every expectation.',
                'is_featured' => true,
            ],
            [
                'client_name' => 'Sarah P.',
                'client_initials' => 'SP',
                'event_type' => 'Charity Gala',
                'rating' => 5,
                'message' => 'Our charity gala was a massive success thanks to D\'Dreams. The execution was flawless and elegant.',
                'is_featured' => true,
            ],
            [
                'client_name' => 'Emily R.',
                'client_initials' => 'ER',
                'event_type' => 'Anniversary',
                'rating' => 4,
                'message' => 'They transformed our vision into something even more beautiful. The attention to detail was impeccable.',
                'is_featured' => true,
            ],
            [
                'client_name' => 'Sarah & Tom L.',
                'client_initials' => 'SL',
                'event_type' => 'Wedding',
                'rating' => 5,
                'message' => 'They turned our dream wedding into reality. Every detail was perfect and the team was a joy to work with.',
                'is_featured' => false,
            ],
            [
                'client_name' => 'Jessica P.',
                'client_initials' => 'JP',
                'event_type' => 'Private Party',
                'rating' => 5,
                'message' => 'The most beautiful baby shower we could have imagined. They elevated every detail.',
                'is_featured' => false,
            ],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::updateOrCreate(
                ['client_name' => $testimonial['client_name'], 'message' => $testimonial['message']],
                $testimonial
            );
        }
    }
}


