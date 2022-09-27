import business_cat from '@/images/business-cat.jpg'

type Props = {
  alt?: string
}

export default (props: Props) => (
  <img className="h-8 w-8 rounded-full" src={business_cat} alt={props.alt} />
)
