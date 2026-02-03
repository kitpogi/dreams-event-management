<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Http\Requests\Testimonial\StoreTestimonialRequest;
use App\Http\Requests\Testimonial\UpdateTestimonialRequest;
use App\Http\Requests\Testimonial\ClientSubmitTestimonialRequest;
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

    public function store(StoreTestimonialRequest $request)
    {
        $validated = $request->validated();
        $validated['avatar_path'] = $this->resolveAvatarPath($request);
        $validated['client_initials'] = $this->resolveInitials($validated);

        $testimonial = Testimonial::create($validated);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache (or use tags if available)

        return $this->successResponse($testimonial, 'Testimonial created successfully', 201);
    }

    public function update(UpdateTestimonialRequest $request, Testimonial $testimonial)
    {
        $validated = $request->validated();

        if ($request->hasFile('avatar') || $request->filled('avatar_url')) {
            $validated['avatar_path'] = $this->resolveAvatarPath($request, $testimonial);
        }

        $validated['client_initials'] = $this->resolveInitials(array_merge($testimonial->toArray(), $validated));

        $testimonial->update($validated);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return $this->successResponse($testimonial, 'Testimonial updated successfully');
    }

    public function destroy(Testimonial $testimonial)
    {
        if ($testimonial->avatar_path && !Str::startsWith($testimonial->avatar_path, ['http://', 'https://'])) {
            Storage::disk('public')->delete($testimonial->avatar_path);
        }

        $testimonial->delete();

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return $this->successResponse(null, 'Testimonial deleted successfully');
    }

    /**
     * Client submission of testimonial (requires authentication)
     */
    public function clientSubmit(ClientSubmitTestimonialRequest $request)
    {
        $user = $request->user();
        
        // Get client info from authenticated user
        $client = \App\Models\Client::where('client_email', $user->email)->first();
        
        if (!$client) {
            return $this->notFoundResponse('Client profile not found');
        }

        $validated = $request->validated();
        
        // Auto-fill client name from user/client data
        if (empty($validated['client_name'])) {
            $validated['client_name'] = $user->name ?? ($client->client_fname . ' ' . $client->client_lname);
        }
        
        $validated['avatar_path'] = $this->resolveAvatarPath($request);
        $validated['client_initials'] = $this->resolveInitials($validated);
        $validated['is_featured'] = false; // New client submissions are not featured by default (admin can feature later)

        $testimonial = Testimonial::create($validated);

        // Clear testimonials cache
        Cache::flush(); // Clear all cache

        return $this->successResponse(
            $testimonial,
            'Thank you for your testimonial! It will be reviewed before being published.',
            201
        );
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


