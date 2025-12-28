<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TestimonialController extends Controller
{
    public function index(Request $request)
    {
        // Build cache key based on request parameters
        $cacheKey = 'testimonials_' . md5(json_encode([
            'featured' => $request->boolean('featured'),
            'limit' => $request->input('limit'),
        ]));

        // Cache for 1 hour
        $testimonials = Cache::remember($cacheKey, now()->addHour(), function () use ($request) {
            $query = Testimonial::query()->orderByDesc('created_at');

            if ($request->boolean('featured')) {
                $query->where('is_featured', true);
            }

            if ($limit = $request->input('limit')) {
                $query->limit((int) $limit);
            }

            return $query->get();
        });

        return response()->json([
            'data' => $testimonials,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['avatar_path'] = $this->resolveAvatarPath($request);
        $data['client_initials'] = $this->resolveInitials($data);

        $testimonial = Testimonial::create($data);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache (or use tags if available)

        return response()->json(['data' => $testimonial], 201);
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $data = $this->validateData($request, false);

        if ($request->hasFile('avatar') || $request->filled('avatar_url')) {
            $data['avatar_path'] = $this->resolveAvatarPath($request, $testimonial);
        }

        $data['client_initials'] = $this->resolveInitials(array_merge($testimonial->toArray(), $data));

        $testimonial->update($data);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return response()->json(['data' => $testimonial]);
    }

    public function destroy(Testimonial $testimonial)
    {
        if ($testimonial->avatar_path && !Str::startsWith($testimonial->avatar_path, ['http://', 'https://'])) {
            Storage::disk('public')->delete($testimonial->avatar_path);
        }

        $testimonial->delete();

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return response()->json(['message' => 'Testimonial deleted successfully']);
    }

    /**
     * Client submission of testimonial (requires authentication)
     */
    public function clientSubmit(Request $request)
    {
        $user = $request->user();
        
        // Get client info from authenticated user
        $client = \App\Models\Client::where('client_email', $user->email)->first();
        
        if (!$client) {
            return response()->json([
                'message' => 'Client profile not found'
            ], 404);
        }

        $data = $this->validateData($request);
        
        // Auto-fill client name from user/client data
        if (empty($data['client_name'])) {
            $data['client_name'] = $user->name ?? ($client->client_fname . ' ' . $client->client_lname);
        }
        
        $data['avatar_path'] = $this->resolveAvatarPath($request);
        $data['client_initials'] = $this->resolveInitials($data);
        $data['is_featured'] = false; // New client submissions are not featured by default (admin can feature later)

        $testimonial = Testimonial::create($data);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return response()->json([
            'message' => 'Thank you for your testimonial! It will be reviewed before being published.',
            'data' => $testimonial
        ], 201);
    }

    protected function validateData(Request $request, bool $isCreate = true): array
    {
        $rules = [
            'client_name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'client_initials' => ['nullable', 'string', 'max:10'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'rating' => [$isCreate ? 'required' : 'sometimes', 'integer', 'min:1', 'max:5'],
            'message' => [$isCreate ? 'required' : 'sometimes', 'string'],
            'is_featured' => ['sometimes', 'boolean'],
            'avatar_url' => ['nullable', 'url'],
            'avatar' => ['nullable', 'image', 'max:4096'],
        ];

        return $request->validate($rules);
    }

    protected function resolveAvatarPath(Request $request, ?Testimonial $existing = null): ?string
    {
        if ($request->hasFile('avatar')) {
            if ($existing && $existing->avatar_path && !Str::startsWith($existing->avatar_path, ['http://', 'https://'])) {
                Storage::disk('public')->delete($existing->avatar_path);
            }

            return $request->file('avatar')->store('testimonials', 'public');
        }

        if ($request->filled('avatar_url')) {
            return $request->input('avatar_url');
        }

        return $existing?->avatar_path;
    }

    protected function resolveInitials(array $data): ?string
    {
        if (!empty($data['client_initials'])) {
            return $data['client_initials'];
        }

        if (empty($data['client_name'])) {
            return null;
        }

        $parts = preg_split('/\s+/', trim($data['client_name']));
        $initials = collect($parts)
            ->filter()
            ->map(static fn ($part) => Str::upper(Str::substr($part, 0, 1)))
            ->join('');

        return Str::limit($initials, 3, '');
    }
}


