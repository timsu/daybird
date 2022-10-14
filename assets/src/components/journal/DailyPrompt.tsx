import { getDayOfYear } from 'date-fns'
import { useState } from 'preact/hooks'

import { XIcon } from '@heroicons/react/outline'

const prompts = [
  '“Pleasure in the job puts perfection in the work.” – Aristotle',
  '“It is not the mountain we conquer, but ourselves.” – Sir Edmund Hillary',
  '“Lost time is never found again.” – Benjamin Franklin',
  'Time is the school in which we learn, time is the fire in which we burn.” – Delmore Schwartz',
  '“No matter how great the talent or efforts, some things just take time. You can’t produce a baby in one month by getting nine women pregnant.” – Warren Buffett',
  '“Productivity is being able to do things that you were never able to do before.” – Franz Kafka',
  ' “If there are nine rabbits on the ground, if you want to catch one, just focus on one.” – Jack Ma',
  '“You may delay, but time will not.” – Benjamin Franklin',
  '“The tragedy in life doesn’t lie in not reaching your goal. The tragedy lies in having no goal to reach.” – Benjamin E. Mays',
  '“If you are interested in balancing work and pleasure, stop trying to balance them. Instead make your work more pleasurable.” – Donald Trump',
  '“Both good and bad days should end with productivity. Your mood affairs should never influence your work.” – Greg Evans',
  '“When one has much to put into them, a day has a hundred pockets.” – Friedrich Nietzsche',
  '“Focus on being productive instead of busy.” -Tim Ferriss',
  ' “Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.” – Paul J. Meyer',
  ' “Until we can manage time, we can manage nothing else.” – Peter Drucker',
  '“Time is not refundable; use it with intention.” – Unknown',
  '“You don’t get paid for the hour, you get paid for the value you bring to the hour.” – Jim Rohn',
  ' “Don’t confuse activity with productivity. Many people are simply busy being busy.” – Robin Sharma',
  ' “If we all did the things we are capable of doing, we would literally astound ourselves.” – Thomas Edison',
  '“There is never enough time to do it right, but there is always enough time to do it over.” – John W. Bergman',
  ' “The way to get started is to quit talking and begin doing.” – Walt Disney',
  '“You don’t need a new plan for next year. You need a commitment.” – Seth Godin',
  '“Efficiency is doing things right. Effectiveness is doing the right things.” – Peter Drucker',
  '“Where your attention goes, your time goes” – Idowu Koyenikan',
  ' “Time management is about life management.” -Idowu Koyenikan',
  ' “You can do anything, but not everything.” – David Allen',
  '“Think of many things; do one.” ~ Portuguese proverb',
  ' “I always had the uncomfortable feeling that if I wasn’t sitting in front of a computer typing, I was wasting my time – but I pushed myself to take a wider view of what was ‘productive.’ Time spent with my family and friends was never wasted.” – Gretchen Rubin',
  '“Working on the right thing is probably more important than working hard.” – Caterina Fake',
  ' “There is no substitute for hard work.” – Thomas Edison',
  '“Never mistake motion for action.” – Ernest Hemingway',
  '“Multitasking is a lie” – Gary Keller',
  '“The key to productivity is to rotate your avoidance techniques.” – Shannon Wheeler',
  '“While one person hesitates because he feels inferior, the other is busy making mistakes and becoming superior.” – Henry C. Link',
  '“What looks like multitasking is really switching back and forth between multiple tasks, which reduces productivity and increases mistakes by up to 50 percent.” – Susan Cain ',
  ' “Productivity is the deliberate, strategic investment of your time, talent, intelligence, energy, resources, and opportunities in a manner calculated to move you measurably closer to meaningful goals.” – Dan S. Kennedy',
  ' “Sameness leaves us in peace but it is contradiction that makes us productive.” – Johnann Wolfgang von Goethe',
  '“Over the long run, the unglamorous habit of frequency fosters both productivity and creativity.” – Gretchen Rubin',
  ' “Knowledge is the source of wealth. Applied to tasks we already know, it becomes productivity. Applied to tasks that are new, it becomes innovation.” – Peter Drucker',
  '“If you want an easy job to seem mighty hard, just keep putting if off.” – Richard Miller',
  '“Procrastination is the fear of success. People procrastinate because they are afraid of the success that they know will result if they move ahead now. Because success is heavy, and carries a responsibility with it, it is much easier to procrastinate and live on the ‘someday I’ll’ philosophy.” – Denis Waitley',
  '“Work hard, have fun, and make history.” – Jeff Bezos',
  '“Don’t worry about breaks every 20 minutes ruining your focus on a task. Contrary to what I might have guessed, taking regular breaks from mental tasks actually improves your creativity and productivity. Skipping breaks, on the other hand, leads to stress and fatigue.” – Tom Rath',
  '“I do not equate productivity to happiness. For most people, happiness in life is a massive amount of achievement plus a massive amount of appreciation. And you need both of those things.” – Tim Ferriss',
  ' “Creativity isn’t about wild talent as much as it’s about productivity. To find new ideas that work, you need to try a lot that don’t. It’s a pure numbers game.” – Robert Sutton',
  ' “Productivity growth, however it occurs, has a disruptive side to it. In the short term, most things that contribute to productivity growth are very painful.” – Janet Yellen',
  '“If you want something done, give it to a busy man.” – Preston Sturges',
  ' “The really happy people are those who have broken the chains of procrastination, those who find satisfaction in doing the job at hand. They’re full of eagerness, zest, and productivity. You can be, too.” – Norman Vincent Peale',
  '“The least productive people are usually the ones who are most in favor of holding meetings.” – Thomas Sowell',
  '“The only way around is through.” – Robert Frost',
  ' “It is not the strongest of the species that survive, nor the most intelligent, but the ones most responsive to change.” – Charles Darwin',
  ' “Improved productivity means less human sweat, not more.” – Henry Ford',
  ' “It’s not always that we need to do more but rather that we need to focus on less.” – Nathan W. Morris',
  '“You must remain focused on your journey to greatness.” – Les Brown',
  ' “Whether you think you can or whether you think you can’t, you’re right!” – Henry Ford',
  ' “Don’t be fooled by the calendar. There are only as many days in the year as you make use of. One man gets only a week’s value out of a year while another man gets a full year’s value out of a week.” – Charles Richards',
  ' “The big secret in life is that there is no big secret. Whatever your goal, you can get there if you’re willing to work.” – Oprah Winfrey',
  ' “Success is often achieved by those who don’t know that failure is inevitable.” – Coco Chanel',
  '“The true price of anything you do is the amount of time you exchange for it.” – Henry David Thoreau',
  '“Ordinary people think merely of spending time, great people think of using it.” – Arthur Schopenhauer',
  '“Drive thy business or it will drive thee.” – Benjamin Franklin',
  ' “Nothing is particularly hard when you divide it into small jobs.” – Henry Ford',
  '“Soon is not as good as now.” – Seth Godin',
  ' “Sometimes, things may not go your way, but the effort should be there every single night.” – Michael Jordan ',
  '“Stressing output is the key to improving productivity, while looking to increase activity can result in just the opposite.” – Paul Gauguin',
  ' “You don’t have to see the whole staircase, just take the first step.” – Martin Luther King',
  'Life’s gardeners pluck the weeds and care only for the productive plants.” – Bryant McGill',
  ' “Don’t watch the clock; do what it does. Keep going.” – Sam Levenson',
  ' “All our productivity, leverage, and insight comes from being part of a community, not apart from it. The goal, I think, is to figure out how to become more dependent, not less.” – Seth Godin',
  ' Amateurs sit and wait for inspiration, the rest of us just get up and go to work. – Stephen King',
  ' By failing to prepare, you are preparing to fail. – Benjamin Franklin',
  ' Concentrate all your thoughts upon the work at hand. The sun’s rays do not burn until brought to a focus. – Alexander Graham Bell',
  'Continuous improvement is better than delayed perfection. – Mark Twain',
  'Do the hard jobs first. The easy jobs will take care of themselves. – Dale Carnegie',
  ' Everything you want is just outside your comfort zone. – Robert Allen',
  ' I fear not the man who has practiced 10,000 kicks, but I do fear the man who has practiced one kick 10,000 times. – Bruce Lee',
  ' If you don’t pay appropriate attention to what has your attention, it will take more of your attention than it deserves. – David Allen',
  ' If you spend too much time thinking about a thing, you’ll never get it done. – Bruce Lee',
  'Motivation is what gets you started. Habit is what keeps you going. – Jim Rohn',
  'Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway. – Earl Nightingale',
  ' Nothing is less productive than to make more efficient what should not be done at all. – Peter Drucke',
  'Plans are nothing; planning is everything. – Dwight D. Eisenhower ',
  'Practice isn’t the thing you do once you’re good. It’s the thing you do that makes you good. – Malcolm Gladwell',
  'Successful people are simply those with successful habits. – Brian Tracy',
  'The key is to not prioritize what’s on your schedule, but to schedule your priorities. – Stephen Covey',
  ' What gets measured gets managed. – Peter Drucker',
  'Work gives you meaning and purpose and life is empty without it. – Stephen hawking',
  'Work like there is someone working twenty-four hours a day to take it all away from you. – Mark Cuban',
  'You can’t have a million dollar dream with a minimum wage worth ethic. – Stephen Hogan',
  'You don’t need more time in your day. You need to decide. – Seth Godin',
  'Fall in love with the process, and the results will come. – Eric Thomas',
  'You were born to win, but to be a winner, you must plan to win, prepare to win, and expect to win. – Zig Ziglar',
  'Your mind is for having ideas, not holding them. – David Allen',
  ' Don’t expect to find you’re doing everything right — the truth often hurts. The goal is to find your inefficiencies in order to eliminate them and to find your strengths so you can multiply them. – Tim Ferriss',
  'Effective performance is preceded by painstaking preparation. – Brian Tracy',
  ' Start by doing what’s necessary, then what’s possible, and suddenly you are doing the impossible. – Francis of Assisi',
  ' Our greatest glory is not in never failing, but in getting up every time we do. – Confucius',
  ' If we did the things we are capable of, we would astound ourselves. – Thomas Edison',
  ' To think is easy. To act is hard. But the hardest thing in the world is to act in accordance with your thinking. – Goethe',
  'You have to expect things of yourself before you can do them. – Michael Jordan',
  'Consistency of performance is essential. You don’t have to be exceptional every week but as a minimum you need to be at a level that even on a bad day you get points on the board. – Sean Dyche',
  'Productivity is not about getting everything done, rather it is about getting things done effectively – Brianna Gray from fixthephoto.com',
]

export default function ({ date }: { date: Date }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  const idx = getDayOfYear(date)
  return (
    <div className="group italic text-gray-500 relative">
      {prompts[idx % prompts.length]}
      <a
        className="hidden group-hover:inline mt-1 ml-1 cursor-pointer absolute"
        title="Hide"
        onClick={() => setHidden(true)}
      >
        <XIcon className="w-3 h-3" />
      </a>
    </div>
  )
}
