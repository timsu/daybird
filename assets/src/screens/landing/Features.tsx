import {
    BookOpenIcon, CalendarIcon, ChatIcon, CheckIcon, DeviceMobileIcon, DownloadIcon, GlobeAltIcon,
    LightningBoltIcon, LockClosedIcon, PencilAltIcon, PencilIcon, PhoneIcon, ScaleIcon, UsersIcon
} from '@heroicons/react/outline'

const features = [
  {
    name: 'Take note',
    description:
      "Write daily notes and as well as named notes in folders. If you've ever used a bullet journal or any other note-taking app you'll feel right at home.",
    icon: PencilAltIcon,
  },
  {
    name: 'Get it done',
    description:
      'Access tasks across all your notes. When planning out your day, check for open tasks for things you may want to get done today.',
    icon: CheckIcon,
  },
  {
    name: 'Schedule it',
    description:
      'View your calendar from your daily journal page to organize blocks of deep work while not missing your meetings.',
    icon: CalendarIcon,
  },
  {
    name: 'Works well with others',
    description:
      'Share entire projects with your family or teammates to get things done together by collaborating on notes and tasks.',
    icon: UsersIcon,
  },
  {
    name: 'Prefer an app?',
    description:
      'Install Daybird as a progressive app for web, desktop, Android, iOS for a native-like experience without extra resource usage.',
    icon: DeviceMobileIcon,
  },
  {
    name: 'Synced and secured',
    description:
      'Notes are encrypted in the cloud so you can write from everywhere with peace of mind. You can also host your own Daybird instance.',
    icon: LockClosedIcon,
  },
]

export default function () {
  return (
    <div className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-lg font-semibold text-lavender-700">FEATURES</h2>
          <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
            A better way to plan your day
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Daybird is built around daily planning and task management, helping you focus on making
            progress on your goals done every day.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-lavender-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg font-medium leading-6 text-gray-900">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
