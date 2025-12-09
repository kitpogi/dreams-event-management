<?php

namespace Database\Seeders;

use App\Models\PortfolioItem;
use Illuminate\Database\Seeder;

class PortfolioItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'title' => 'Enchanted Garden Wedding',
                'category' => 'Weddings',
                'event_date' => '2024-01-15',
                'description' => 'Romantic open-air reception surrounded by lush florals and warm lighting.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf9_oOqOkuvQAwEXMGPblvrsuV0OUV1wpSyIU4GKuhDtdW8mO4Dd9z_O4ip2Cc7zYANPAy-k3DOza1JeFLGzsX1oZWD4JGeG5BUxQvp9deZUXhBOujS1Z9zoS_F5dXce4Wb2EOZM36nGjYP3L3knfHlsKKsh42HGnXtFMz0U1zhKp5moZCBGz0zptqk6gEI-8Jw-zX0KffdVN_dWm7r2N8fShvBR9TiXeunpxBZExug3P8_fhqBgyRZqB02oFWsVDgNXblRxcervmk',
                'is_featured' => true,
            ],
            [
                'title' => 'Modern Corporate Gala',
                'category' => 'Corporate Events',
                'event_date' => '2024-02-20',
                'description' => 'Sleek, branded experience complete with dramatic uplighting and interactive displays.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6KW-Hd-oFTYg3VCcw366qk3hpBe-q2XPDfm5MC-QaSweimWP8vFtQXsocu9_zTLSoS5IaXAHWREIjK-NkiMUwrKAd0kS1n1BBUKBOGuljuD299X9KPg0TAXG0pk7VWe8MvfflXN_g2wIDo9HOhm6WiC8Ez9SONENILWdSKF4Kb48kC8y28_326tMH2ASiYnecCwT0o9hPUDERBQZukQrKx-6dpq0glKLtbNbFdDN0xBGRZ3rwvaRPlElgCJ42wgLFTTZWwwA4IDXg',
                'is_featured' => true,
            ],
            [
                'title' => 'Whimsical Birthday Bash',
                'category' => 'Themed Parties',
                'event_date' => '2024-03-10',
                'description' => 'Colorful celebration filled with playful textures, balloons, and statement decor.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu2pkyAxsBsQAllEWiLGorbnZ02tMX9vF7NkWZFNAF8Ir57S_Lh_H1J-4nl4-wFvQ-slgQxP6u6qbIwR1PM1gQXYA_qDdlQ3Gxw2EZwusultV-dxDD5-MEx09Oe4s6uknAVVmPWYD7kti7SQ1ZuqYBJcOo4KN5Ji7odQnR213Q4p2QktnFa5O7GtNIU8lkgdzsJ4iNU-RBvCzOGLHbbJp8rcAut6F3689_VYTak4PokRRbaFSKOsdfQZy_eq66fw2v5MB076V4Mqhz',
                'is_featured' => true,
            ],
            [
                'title' => 'Elegant Styled Shoot',
                'category' => 'Weddings',
                'event_date' => '2024-04-05',
                'description' => 'Editorial shoot showcasing tablescapes, couture gowns, and bespoke installations.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOFRVzp-lQWdOj66pfI88O23-OR_KCXBveU7epp3zKPQwItxvDbclr8piZOAbnTBaJvcxEawW12_hK5ejEl-4QqacU3cnoEJsmZzok8UKxwBPU0zaibYHys_NV2_ImcRnbWnCJgCbS52lH_C8VYEi6B1Tkip1ui48PQ7Q761WFf53cW5Yz5V1NV9V8rOAlQn4B908qcTiU5yxYL6M2DH9IFidq07_mUpbkFmnZPm2x0mWwGUsipNgoWtFpe8v7KeHwD-0gyBgRKMrt',
                'is_featured' => true,
            ],
            [
                'title' => 'Luxury Anniversary Dinner',
                'category' => 'Themed Parties',
                'event_date' => '2024-05-18',
                'description' => 'Intimate celebration layered with candles, velvet textiles, and curated menus.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOErmx1Rvf2UQiN8mZbHuCRNLqaqDSEEzUsAvwScNYGColoE9Bs0QruWON-lb4y44WsCjSelbZKjx43Y9tk7doG2moMcuOGvlP7obP6dHwnxFgiyigDv_2HfMf0sNRopGTj2ObYuJI1RvUY2QXvUtEV1Ul4vCEQJXES8OKosnoHJQznypcc443Z6QkZBeO7NXM43-I-GujoTy8cvhcxl45hsCf10kfaueE5Z7sMHjjq8IFRWC3OmfH27KrATPTKoOyJDhdMmdfRpL3',
                'is_featured' => true,
            ],
            [
                'title' => 'Vibrant Product Launch',
                'category' => 'Corporate Events',
                'event_date' => '2024-06-22',
                'description' => 'High-energy launch punctuated with immersive lighting and branded experiences.',
                'image_path' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmJ-pzwZ2LcEtO_wwGg0-JeUHEbidzFW1arbbWO54R9-vL1PI8RpsfFSwjMJqy0MGuDE_0ENPTHESfvQIWGtD-ELtg35Nd06oCLPtwCPYPeuO4GMNINNo2eFoOPZWmgeULtZm4KJhfwesSM-9lNB1C9xZg1HlRu5lffMYfvIE_KzMXmdwMPR1Beuz4laBJetLbLHIubGRasEoS7RHEhimQwFKhFqxdI0E5jGN5xmvpdPAigATGsdWC_YLO2GMn4Pfyq5k-cQvUHc7I',
                'is_featured' => true,
            ],
        ];

        foreach ($items as $index => $item) {
            PortfolioItem::updateOrCreate(
                ['title' => $item['title']],
                array_merge($item, ['display_order' => $index + 1])
            );
        }
    }
}


