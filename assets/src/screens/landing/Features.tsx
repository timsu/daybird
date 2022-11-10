import {
    BookOpenIcon, CalendarIcon, ChatIcon, CheckIcon, DeviceMobileIcon, DownloadIcon, GlobeAltIcon,
    LightningBoltIcon, LockClosedIcon, PencilAltIcon, PencilIcon, PhoneIcon, ScaleIcon, UsersIcon
} from '@heroicons/react/outline'

const features = [
  {
    name: 'Write about it',
    description:
      'Write daily notes and as well as named notes in folders with our beautiful Markdown-supported editor.',
    icon: PencilAltIcon,
  },
  {
    name: 'Plan your day',
    description:
      'Add your personal and work Google Calendar to get an overview of your day and prepare for your meetings.',
    icon: CalendarIcon,
  },
  {
    name: 'Get it done',
    description:
      'Access tasks across all your notes. Each day, check for open tasks for things you may want to get done today.',
    icon: CheckIcon,
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
      'Install Daybird on your Mac, Windows, Linux, Android and iOS devices for quick access to your notes.',
    icon: DeviceMobileIcon,
  },
  {
    name: 'Synced and secured',
    description:
      'Notes are encrypted in the cloud so you can safely write from anywhere. You can also host a private Daybird instance.',
    icon: LockClosedIcon,
  },
]

export default function () {
  return (
    <div className="bg-white py-12 px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-lg font-semibold text-lavender-700">Features</h2>
          <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
            A better way to plan
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Daybird is built around daily planning and task management, helping you focus on making
            progress on your goals every day.
          </p>
        </div>

        <div className="mt-10 text-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="h-full flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center rounded-md bg-lavender-500 p-3 shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">
                      {feature.name}
                    </h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
