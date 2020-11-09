<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Notifications\RegistrationAccepted;
use Biigle\Notifications\RegistrationRejected;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Notification;

class UserRegistrationControllerTest extends ApiTestCase
{
    public function testAcceptRegistration()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::guestId()]);
        $this->doTestApiRoute('GET', "/api/v1/accept-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(403);

        $this->beGlobalAdmin();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertEquals(Role::editorId(), $user->fresh()->role_id);

        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(404);
        Notification::assertSentTo($user, RegistrationAccepted::class);
    }

    public function testAcceptRegistrationDisabled()
    {
        config(['biigle.user_registration_confirmation' => false]);
        $user = UserTest::create(['role_id' => Role::guestId()]);
        $this->beGlobalAdmin();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(404);
    }

    public function testRejectRegistration()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::editorId()]);
        $this->doTestApiRoute('GET', "/api/v1/reject-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(403);

        $this->beGlobalAdmin();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(404);

        $user = UserTest::create(['role_id' => Role::guestId()]);

        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertNull($user->fresh());
        Notification::assertSentTo($user, RegistrationRejected::class);
    }

    public function testRejectRegistrationDisabled()
    {
        config(['biigle.user_registration_confirmation' => false]);
        $user = UserTest::create(['role_id' => Role::guestId()]);
        $this->beGlobalAdmin();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(404);
    }
}
