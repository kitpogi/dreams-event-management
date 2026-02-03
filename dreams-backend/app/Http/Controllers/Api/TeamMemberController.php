<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TeamMemberController extends Controller
{
    public function index()
    {
        $team = TeamMember::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $team
        ]);
    }

    public function adminIndex()
    {
        $team = TeamMember::orderBy('sort_order')->get();
        return response()->json([
            'success' => true,
            'data' => $team
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        if ($request->hasFile('image')) {
            $imageService = app(ImageService::class);
            $path = $imageService->processAndStore($request->file('image'), 'team');
            $validated['image'] = $path;
        }

        $member = TeamMember::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Team member added successfully',
            'data' => $member
        ], 201);
    }

    public function show(TeamMember $teamMember)
    {
        return response()->json([
            'success' => true,
            'data' => $teamMember
        ]);
    }

    public function update(Request $request, TeamMember $teamMember)
    {
        $validated = $this->validateData($request, false);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($teamMember->image && !Str::startsWith($teamMember->image, ['http://', 'https://'])) {
                app(ImageService::class)->deleteImage($teamMember->image);
            }

            $imageService = app(ImageService::class);
            $path = $imageService->processAndStore($request->file('image'), 'team');
            $validated['image'] = $path;
        }

        $teamMember->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Team member updated successfully',
            'data' => $teamMember
        ]);
    }

    public function destroy(TeamMember $teamMember)
    {
        if ($teamMember->image && !Str::startsWith($teamMember->image, ['http://', 'https://'])) {
            app(ImageService::class)->deleteImage($teamMember->image);
        }

        $teamMember->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team member deleted successfully'
        ]);
    }

    protected function validateData(Request $request, bool $isCreate = true): array
    {
        $rules = [
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'role' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'facebook_link' => ['nullable', 'string', 'url'],
            'instagram_link' => ['nullable', 'string', 'url'],
            'twitter_link' => ['nullable', 'string', 'url'],
            'linkedin_link' => ['nullable', 'string', 'url'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ];

        return $request->validate($rules);
    }
}
