import GoogleIconSvg from '@/images/btn_google_light_normal_ios.svg'

// tslint:disable:max-line-length

type Props = {
  size?: number
}

const GoogleIcon = ({ size = 16, ...rest }: Props) => (
  <img width={size} height={size} src={GoogleIconSvg} {...rest} />
)

export default GoogleIcon
